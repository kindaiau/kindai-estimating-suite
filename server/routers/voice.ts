import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { transcribeAudio } from "../_core/voiceTranscription";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const voiceRouter = router({
  /**
   * Upload raw audio (base64) to S3 and return a URL for transcription.
   * Accepts webm/mp3/wav/ogg/m4a up to 16MB.
   * Works for both authenticated users and demo (public) users.
   */
  uploadAudio: publicProcedure
    .input(
      z.object({
        audioBase64: z.string().max(22_000_000), // ~16MB base64
        contentType: z.enum([
          "audio/webm",
          "audio/mp3",
          "audio/mpeg",
          "audio/wav",
          "audio/wave",
          "audio/ogg",
          "audio/m4a",
          "audio/mp4",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.audioBase64, "base64");
      const MAX_SIZE = 16 * 1024 * 1024; // 16MB
      if (buffer.length > MAX_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Audio file too large. Maximum is 16MB. Your file is ${(buffer.length / 1024 / 1024).toFixed(1)}MB.`,
        });
      }
      const extMap: Record<string, string> = {
        "audio/webm": "webm",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/ogg": "ogg",
        "audio/m4a": "m4a",
        "audio/mp4": "m4a",
      };
      const ext = extMap[input.contentType] ?? "webm";
      const key = `voice/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url, key };
    }),

  /**
   * Transcribe an audio URL using Whisper.
   * Returns the transcribed text ready to be injected into the job description field.
   * Works for both authenticated users and demo (public) users.
   */
  transcribe: publicProcedure
    .input(
      z.object({
        audioUrl: z.string().url(),
        language: z.string().optional().default("en"),
        /** Optional hint to improve accuracy — e.g. trade name */
        prompt: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const constructionPrompt =
        input.prompt ||
        "Construction estimating job description. Australian building trades. May include trade names, material quantities, room types, and building specifications.";

      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language,
        prompt: constructionPrompt,
      });

      if ("error" in result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
          cause: result,
        });
      }

      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      };
    }),
});
