export type SurveyFrame = { seconds: number; image: string };
export async function sampleFencingVideo(file: File): Promise<SurveyFrame[]> {
  if (file.size > 100 * 1024 * 1024)
    throw new Error(
      "Choose a clip smaller than 100 MB. Record a short clip or trim it in Photos."
    );
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const url = URL.createObjectURL(file);
  const wait = (event: "loadeddata" | "seeked", action: () => void) =>
    new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(
        () =>
          finish(
            new Error(
              "This video could not be decoded. Try an MP4 clip or iPhone Most Compatible recording."
            )
          ),
        15000
      );
      const done = () => finish();
      const error = () =>
        finish(
          new Error(
            "This video format is unsupported. Try an MP4 clip or iPhone Most Compatible recording."
          )
        );
      function finish(err?: Error) {
        clearTimeout(timer);
        video.removeEventListener(event, done);
        video.removeEventListener("error", error);
        err ? reject(err) : resolve();
      }
      video.addEventListener(event, done, { once: true });
      video.addEventListener("error", error, { once: true });
      action();
    });
  try {
    await wait("loadeddata", () => {
      video.src = url;
      video.load();
    });
    if (
      !Number.isFinite(video.duration) ||
      video.duration <= 0 ||
      video.duration > 120
    )
      throw new Error(
        "Please use a clip between 1 and 120 seconds. Split long walks into separate clips."
      );
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      1024 / Math.max(video.videoWidth, video.videoHeight)
    );
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvas.width)
      throw new Error("Video frame extraction is unavailable on this device.");
    const frames: SurveyFrame[] = [];
    for (let i = 0; i < 8; i++) {
      const seconds = (video.duration * i) / 8;
      if (Math.abs(video.currentTime - seconds) > 0.01)
        await wait("seeked", () => {
          video.currentTime = seconds;
        });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let image = canvas.toDataURL("image/jpeg", 0.7);
      if (image.length > 450000) image = canvas.toDataURL("image/jpeg", 0.4);
      if (image.length > 450000)
        throw new Error(
          "Video frames are too large. Try a lower-resolution recording."
        );
      frames.push({ seconds, image });
    }
    return frames;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
