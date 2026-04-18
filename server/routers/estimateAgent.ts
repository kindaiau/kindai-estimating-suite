/**
 * estimateAgent.ts
 * Conversational estimate editing via LLM tool calling.
 *
 * The user can say things like:
 *   "Add 10 hours commissioning at $120/hr"
 *   "Remove the provisional sum for waterproofing"
 *   "Change the labour rate on item 3 to $95"
 *   "What's my current total?"
 *
 * The agent interprets the intent, calls the appropriate tool(s),
 * and returns a plain-English confirmation of what changed.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM, Tool, Message } from "../_core/llm";
import { requireDatabase } from "../_core/errors";
import { getDb } from "../db";
import { lineItems, estimates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Tool definitions for the LLM ────────────────────────────────────────────

const ESTIMATE_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "add_line_item",
      description: "Add a new line item to the estimate",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Item description" },
          category: {
            type: "string",
            enum: ["Materials", "Labour", "Plant", "Subcontract", "Preliminaries"],
            description: "Item category",
          },
          unit: { type: "string", description: "Unit of measure (ea, hr, m², lm, etc.)" },
          quantity: { type: "number", description: "Quantity" },
          unitRate: { type: "number", description: "Unit rate in AUD" },
          section: { type: "string", description: "Section/trade area this item belongs to" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["description", "category", "unit", "quantity", "unitRate"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_line_item",
      description: "Update an existing line item by its ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Line item ID" },
          description: { type: "string", description: "New description (optional)" },
          quantity: { type: "number", description: "New quantity (optional)" },
          unitRate: { type: "number", description: "New unit rate in AUD (optional)" },
          notes: { type: "string", description: "New notes (optional)" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_line_item",
      description: "Remove a line item from the estimate by its ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Line item ID to delete" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_estimate_summary",
      description: "Get the current estimate totals and line item count",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
];

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(trade: string, estimateTitle: string, lineItemsSummary: string): string {
  return `You are the Kindai Estimate Agent — an AI assistant that can directly edit construction estimates.

You are currently editing: "${estimateTitle}" (${trade} trade)

Current line items:
${lineItemsSummary}

You have access to these tools:
- add_line_item: Add a new item to the estimate
- update_line_item: Change quantity, rate, or description of an existing item
- delete_line_item: Remove an item from the estimate
- get_estimate_summary: Get current totals

RULES:
- When the user asks to add, remove, or change something — use the appropriate tool
- When the user asks a question about the estimate — answer directly from the line items shown above
- Always confirm what you did in plain English after using a tool
- Use Australian construction terminology
- Rates are in AUD
- If the user's request is ambiguous, ask a clarifying question before acting
- Never make up item IDs — only use IDs from the line items list above`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const estimateAgentRouter = router({
  /**
   * Main conversational edit endpoint.
   * Accepts a message + estimate context, runs tool-calling loop, applies changes.
   */
  chat: protectedProcedure
    .input(
      z.object({
        estimateId: z.number(),
        message: z.string().min(1).max(2000),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .max(20)
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      // Load estimate + verify ownership
      const [estimate] = await db
        .select()
        .from(estimates)
        .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
        .limit(1);

      if (!estimate) {
        return { reply: "Estimate not found or you don't have access to it.", actions: [] };
      }

      // Load current line items
      const items = await db
        .select()
        .from(lineItems)
        .where(eq(lineItems.estimateId, input.estimateId));

      // Build line items summary for the system prompt
      const lineItemsSummary =
        items.length === 0
          ? "No line items yet."
          : items
              .map(
                (i) =>
                  `ID:${i.id} | ${i.category} | ${i.description} | ${i.quantity} ${i.unit} @ $${i.unitRate} = $${i.subtotal}${i.section ? ` [${i.section}]` : ""}`
              )
              .join("\n");

      const systemPrompt = buildSystemPrompt(
        estimate.trade ?? "General",
        estimate.title ?? "Untitled Estimate",
        lineItemsSummary
      );

      // Build messages for the LLM
      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        ...input.history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: input.message },
      ];

      // ─── Tool-calling loop (max 3 iterations) ─────────────────────────────────────
      const actionsPerformed: Array<{ tool: string; args: Record<string, unknown>; result: string }> = [];
      let finalReply = "";
      let loopMessages: Message[] = [...messages];

      for (let iteration = 0; iteration < 3; iteration++) {
        const response = await invokeLLM({
          messages: loopMessages,
          tools: ESTIMATE_TOOLS,
          toolChoice: "auto",
          thinkingBudget: 256,
        });

        const choice = response.choices[0];
        if (!choice) break;

        const toolCalls = choice.message.tool_calls;

        // No tool calls — this is the final text response
        if (!toolCalls || toolCalls.length === 0) {
          const content = choice.message.content;
          finalReply = typeof content === "string" ? content : JSON.stringify(content);
          break;
        }

        // Process each tool call
        const toolResults: Array<{ tool_call_id: string; role: "tool"; content: string }> = [];

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
          }

          let toolResult = "";

          try {
            if (toolName === "add_line_item") {
              const { description, category, unit, quantity, unitRate, section, notes } = args as {
                description: string;
                category: string;
                unit: string;
                quantity: number;
                unitRate: number;
                section?: string;
                notes?: string;
              };
              const subtotal = (quantity * unitRate).toFixed(2);
              await db.insert(lineItems).values({
                estimateId: input.estimateId,
                description,
                category: category as any,
                unit,
                quantity: quantity.toString(),
                unitRate: unitRate.toString(),
                subtotal,
                section: section ?? null,
                notes: notes ?? null,
                isFromAi: false,
                sortOrder: items.length + actionsPerformed.length,
              });
              toolResult = `Added: ${description} — ${quantity} ${unit} @ $${unitRate} = $${subtotal}`;
            } else if (toolName === "update_line_item") {
              const { id, description, quantity, unitRate, notes } = args as {
                id: number;
                description?: string;
                quantity?: number;
                unitRate?: number;
                notes?: string;
              };
              // Verify item belongs to this estimate
              const [item] = await db
                .select()
                .from(lineItems)
                .where(and(eq(lineItems.id, id), eq(lineItems.estimateId, input.estimateId)))
                .limit(1);
              if (!item) {
                toolResult = `Error: Line item ${id} not found in this estimate.`;
              } else {
                const newQty = quantity ?? parseFloat(item.quantity);
                const newRate = unitRate ?? parseFloat(item.unitRate);
                const newSubtotal = (newQty * newRate).toFixed(2);
                await db
                  .update(lineItems)
                  .set({
                    ...(description !== undefined && { description }),
                    ...(quantity !== undefined && { quantity: quantity.toString() }),
                    ...(unitRate !== undefined && { unitRate: unitRate.toString() }),
                    ...(notes !== undefined && { notes }),
                    subtotal: newSubtotal,
                  })
                  .where(eq(lineItems.id, id));
                toolResult = `Updated item ${id}: new subtotal $${newSubtotal}`;
              }
            } else if (toolName === "delete_line_item") {
              const { id } = args as { id: number };
              const [item] = await db
                .select()
                .from(lineItems)
                .where(and(eq(lineItems.id, id), eq(lineItems.estimateId, input.estimateId)))
                .limit(1);
              if (!item) {
                toolResult = `Error: Line item ${id} not found in this estimate.`;
              } else {
                await db.delete(lineItems).where(eq(lineItems.id, id));
                toolResult = `Deleted: ${item.description}`;
              }
            } else if (toolName === "get_estimate_summary") {
              const currentItems = await requireDatabase(await getDb())
                .select()
                .from(lineItems)
                .where(eq(lineItems.estimateId, input.estimateId));
              const total = currentItems.reduce((sum: number, i: typeof currentItems[number]) => sum + parseFloat(i.subtotal), 0);
              toolResult = `${currentItems.length} line items. Total (ex markup/GST): $${total.toFixed(2)}`;
            } else {
              toolResult = `Unknown tool: ${toolName}`;
            }
          } catch (err: any) {
            toolResult = `Error executing ${toolName}: ${err.message}`;
          }

          actionsPerformed.push({ tool: toolName, args, result: toolResult });
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: toolResult,
          });
        }

        // Add assistant's tool call message and tool results to the loop
        loopMessages = [
          ...loopMessages,
          {
            role: "assistant" as const,
            content: JSON.stringify(toolCalls.map((tc) => ({ tool_call: { name: tc.function.name, arguments: tc.function.arguments } }))),
          },
          ...toolResults.map((tr) => ({
            role: "tool" as const,
            content: tr.content,
            tool_call_id: tr.tool_call_id,
            name: tr.tool_call_id,
          })),
        ];
      }

      // If we exhausted iterations without a final reply, ask the LLM for a summary
      if (!finalReply && actionsPerformed.length > 0) {
        const summaryResponse = await invokeLLM({
          messages: [
            ...loopMessages,
            {
              role: "user" as const,
              content: "Summarise what you just did in one or two sentences.",
            },
          ],
        });
        const content = summaryResponse.choices[0]?.message?.content;
        finalReply = typeof content === "string" ? content : "Done — estimate updated.";
      }

      if (!finalReply) {
        finalReply = "I couldn't process that request. Please try rephrasing.";
      }

      return {
        reply: finalReply,
        actions: actionsPerformed,
      };
    }),
});
