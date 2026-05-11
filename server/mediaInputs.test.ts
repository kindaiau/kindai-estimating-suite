import { describe, expect, it } from "vitest";
import { buildOpenAIResponsesPayload } from "./_core/llm";
import { isPdfUrl, mediaContentFromUrl, mediaContentsFromUrls } from "./_core/mediaInputs";

describe("media input helpers", () => {
  it("detects signed PDF URLs with query strings", () => {
    expect(isPdfUrl("https://cdn.example.com/plans/abc.PDF?X-Amz-Signature=123")).toBe(true);
    expect(isPdfUrl("https://cdn.example.com/plans/abc.png?download=abc.pdf")).toBe(false);
  });

  it("maps PDFs to file_url inputs and images to image_url inputs", () => {
    expect(mediaContentFromUrl("https://cdn.example.com/plans/job.pdf")).toEqual({
      type: "file_url",
      file_url: {
        url: "https://cdn.example.com/plans/job.pdf",
        mime_type: "application/pdf",
      },
    });

    expect(mediaContentFromUrl("https://cdn.example.com/plans/page.jpg")).toEqual({
      type: "image_url",
      image_url: {
        url: "https://cdn.example.com/plans/page.jpg",
        detail: "high",
      },
    });
  });

  it("maps mixed media URLs in order", () => {
    expect(mediaContentsFromUrls([
      "https://cdn.example.com/page-1.webp",
      "https://cdn.example.com/spec.pdf",
    ])).toEqual([
      {
        type: "image_url",
        image_url: {
          url: "https://cdn.example.com/page-1.webp",
          detail: "high",
        },
      },
      {
        type: "file_url",
        file_url: {
          url: "https://cdn.example.com/spec.pdf",
          mime_type: "application/pdf",
        },
      },
    ]);
  });
});

describe("OpenAI Responses multimodal payload", () => {
  it("converts chat-style media content to Responses input_file and input_image parts", () => {
    const payload = buildOpenAIResponsesPayload({
      messages: [
        { role: "system", content: "Return a structured construction takeoff." },
        {
          role: "user",
          content: [
            mediaContentFromUrl("https://cdn.example.com/plans/job.pdf"),
            mediaContentFromUrl("https://cdn.example.com/plans/photo.jpg"),
            { type: "text", text: "Trade: electrical" },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "takeoff",
          strict: true,
          schema: {
            type: "object",
            properties: { confidence: { type: "number" } },
            required: ["confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    expect(payload.instructions).toBe("Return a structured construction takeoff.");
    expect((payload.input as any[])[0]).toEqual({
      role: "user",
      content: [
        { type: "input_file", file_url: "https://cdn.example.com/plans/job.pdf" },
        { type: "input_image", image_url: "https://cdn.example.com/plans/photo.jpg", detail: "high" },
        { type: "input_text", text: "Trade: electrical" },
      ],
    });
    expect(payload.text).toEqual({
      format: {
        type: "json_schema",
        name: "takeoff",
        strict: true,
        schema: {
          type: "object",
          properties: { confidence: { type: "number" } },
          required: ["confidence"],
          additionalProperties: false,
        },
      },
    });
  });
});
