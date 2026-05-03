import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high" | "original";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  /** Override the thinking budget in tokens (default 128). Use 2048+ for complex multi-pass analysis. */
  thinkingBudget?: number;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type OpenAIInputContentPart =
  | { type: "input_text"; text: string }
  | {
      type: "input_image";
      image_url: string;
      detail?: ImageContent["image_url"]["detail"];
    }
  | { type: "input_file"; file_url: string };

type OpenAITextFormat =
  | { type: "text" }
  | { type: "json_object" }
  | {
      type: "json_schema";
      name: string;
      schema: Record<string, unknown>;
      strict?: boolean;
    };

const messageHasMedia = (message: Message): boolean =>
  ensureArray(message.content).some(
    (part) =>
      typeof part !== "string" &&
      (part.type === "image_url" || part.type === "file_url")
  );

const canUseOpenAIResponses = (params: InvokeParams): boolean =>
  Boolean(ENV.openAiApiKey) &&
  (!params.tools || params.tools.length === 0) &&
  params.messages.some(messageHasMedia) &&
  params.messages.every(
    (message) => message.role !== "tool" && message.role !== "function"
  );

const contentPartToText = (part: MessageContent): string => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  return "";
};

const buildOpenAIInstructions = (messages: Message[]): string | undefined => {
  const instructions = messages
    .filter((message) => message.role === "system")
    .flatMap((message) => ensureArray(message.content).map(contentPartToText))
    .map((text) => text.trim())
    .filter(Boolean);

  return instructions.length > 0 ? instructions.join("\n\n") : undefined;
};

const normalizeOpenAIContentPart = (
  part: MessageContent
): OpenAIInputContentPart => {
  if (typeof part === "string") {
    return { type: "input_text", text: part };
  }

  if (part.type === "text") {
    return { type: "input_text", text: part.text };
  }

  if (part.type === "image_url") {
    return {
      type: "input_image",
      image_url: part.image_url.url,
      ...(part.image_url.detail ? { detail: part.image_url.detail } : {}),
    };
  }

  if (part.type === "file_url") {
    return {
      type: "input_file",
      file_url: part.file_url.url,
    };
  }

  throw new Error("Unsupported OpenAI Responses content part");
};

const normalizeOpenAIMessage = (message: Message) => ({
  role: message.role === "assistant" ? "assistant" : "user",
  content: ensureArray(message.content).map(normalizeOpenAIContentPart),
});

const normalizeOpenAITextFormat = (params: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}): OpenAITextFormat | undefined => {
  const format = normalizeResponseFormat(params);
  if (!format) return undefined;

  if (format.type === "json_schema") {
    return {
      type: "json_schema",
      name: format.json_schema.name,
      schema: format.json_schema.schema,
      ...(typeof format.json_schema.strict === "boolean"
        ? { strict: format.json_schema.strict }
        : {}),
    };
  }

  return format;
};

const supportsOpenAIReasoning = (model: string): boolean =>
  /^(gpt-5|o\d|o[.-])/i.test(model);

const mapThinkingBudgetToEffort = (
  thinkingBudget: number | undefined
): "low" | "medium" | "high" | "xhigh" | undefined => {
  if (typeof thinkingBudget !== "number") return undefined;
  if (thinkingBudget >= 8192) return "xhigh";
  if (thinkingBudget >= 2048) return "high";
  if (thinkingBudget >= 512) return "medium";
  return "low";
};

export function buildOpenAIResponsesPayload(
  params: InvokeParams
): Record<string, unknown> {
  const model = ENV.openAiModel || "gpt-5.5";
  const input = params.messages
    .filter((message) => message.role !== "system")
    .map(normalizeOpenAIMessage)
    .filter((message) => message.content.length > 0);

  const payload: Record<string, unknown> = {
    model,
    input,
    max_output_tokens: params.maxTokens ?? params.max_tokens ?? 32768,
  };

  const instructions = buildOpenAIInstructions(params.messages);
  if (instructions) {
    payload.instructions = instructions;
  }

  const textFormat = normalizeOpenAITextFormat({
    responseFormat: params.responseFormat,
    response_format: params.response_format,
    outputSchema: params.outputSchema,
    output_schema: params.output_schema,
  });
  if (textFormat) {
    payload.text = { format: textFormat };
  }

  const effort = mapThinkingBudgetToEffort(params.thinkingBudget);
  if (effort && supportsOpenAIReasoning(model)) {
    payload.reasoning = { effort };
  }

  return payload;
}

const extractOpenAIOutputText = (data: any): string => {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const output = Array.isArray(data?.output) ? data.output : [];
  const textParts: string[] = [];
  const refusals: string[] = [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        textParts.push(part.text);
      }
      if (part?.type === "refusal" && typeof part.refusal === "string") {
        refusals.push(part.refusal);
      }
    }
  }

  if (refusals.length > 0) {
    throw new Error(`OpenAI refused the request: ${refusals.join(" ")}`);
  }

  return textParts.join("\n").trim();
};

const invokeOpenAIResponses = async (
  params: InvokeParams
): Promise<InvokeResult> => {
  const apiKey = ENV.openAiApiKey;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const payload = buildOpenAIResponsesPayload(params);
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () =>
      controller.abort(
        new Error("OpenAI Responses request timed out after 120s")
      ),
    120_000
  );

  let response: Response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI Responses invoke failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json() as any;
  if (data.status && data.status !== "completed") {
    throw new Error(
      `OpenAI Responses did not complete: ${data.status} ${JSON.stringify(
        data.error || data.incomplete_details || {}
      )}`
    );
  }

  const content = extractOpenAIOutputText(data);
  if (!content) {
    throw new Error("OpenAI Responses returned no output text");
  }

  return {
    id: data.id ?? "openai-response",
    created: data.created_at ?? Math.floor(Date.now() / 1000),
    model: data.model ?? String(payload.model),
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: data.status === "completed" ? "stop" : data.status ?? null,
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens ?? 0,
          completion_tokens: data.usage.output_tokens ?? 0,
          total_tokens: data.usage.total_tokens ?? 0,
        }
      : undefined,
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (canUseOpenAIResponses(params)) {
    return invokeOpenAIResponses(params);
  }

  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    thinkingBudget,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 32768
  payload.thinking = {
    "budget_tokens": thinkingBudget ?? 128
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  // Abort after 90 seconds to prevent AI calls from hanging indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("LLM request timed out after 90s")), 90_000);
  let response: Response;
  try {
    response = await fetch(resolveApiUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
