import type { FileContent, ImageContent } from "./llm";

type ImageDetail = NonNullable<ImageContent["image_url"]["detail"]>;

export type MediaInputContent = ImageContent | FileContent;

export function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.split(/[?#]/, 1)[0].toLowerCase().endsWith(".pdf");
  }
}

export function mediaContentFromUrl(
  url: string,
  detail: ImageDetail = "high"
): MediaInputContent {
  if (isPdfUrl(url)) {
    return {
      type: "file_url",
      file_url: { url, mime_type: "application/pdf" },
    };
  }

  return {
    type: "image_url",
    image_url: { url, detail },
  };
}

export function mediaContentsFromUrls(
  urls: string[],
  detail: ImageDetail = "high"
): MediaInputContent[] {
  return urls.map((url) => mediaContentFromUrl(url, detail));
}
