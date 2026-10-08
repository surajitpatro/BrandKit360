/**
 * AI Studio (§22) — optional AI layer. The core product works without AI.
 * AI uses the structured brand system as context and never silently changes
 * locked elements (enforced: locked fields are stripped from the prompt and
 * the client must keep them unchanged).
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { createRouter, authedQuery } from "./middleware";
import { kimiGw } from "./ai/provider";
import { listModels, classifyAiError, AiTransient } from "./lib/ai-client";
import { requireEntitlement } from "./queries/entitlements";
import type { BrandDNA, VoiceSystem } from "../contracts/brand";

function toTrpcError(err: unknown): TRPCError {
  const classified = classifyAiError(err);
  if (classified instanceof AiTransient) {
    return new TRPCError({
      code: "TIMEOUT",
      message: "The AI service is briefly unavailable. Please retry in a moment.",
    });
  }
  if (classified.name === "AiUnavailable") {
    return new TRPCError({
      code: "FORBIDDEN",
      message:
        "AI quota is exhausted, so this feature is currently unavailable. The rest of your brand system keeps working — only AI assistance is paused.",
    });
  }
  if (classified.name === "ContentRejected") {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "That request was rejected. Try rephrasing it.",
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "AI misconfigured or request invalid.",
  });
}

const dnaSchema = z.object({
  essence: z.string(),
  positioning: z.string(),
  promise: z.string(),
  toneOfVoice: z.string(),
  visualDirection: z.string(),
  keywords: z.array(z.string()).max(8),
});

const copySchema = z.object({
  headlines: z.array(z.string()).max(6),
  captions: z.array(z.string()).max(6),
  ctas: z.array(z.string()).max(6),
});

async function defaultModel() {
  const { defaultModelId } = await listModels();
  return kimiGw(defaultModelId);
}

export const aiRouter = createRouter({
  /** "Make it more premium." — refine Brand DNA with the current system as context. */
  refineDna: authedQuery
    .input(
      z.object({
        brandName: z.string(),
        business: z.string(),
        dna: z.custom<BrandDNA>((v) => typeof v === "object" && v !== null),
        instruction: z.string().min(2).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireEntitlement(ctx.user.id, "ai_studio");
      try {
        const model = await defaultModel();
        const result = await generateObject({
          model,
          schema: dnaSchema,
          prompt: [
            `You are the Brand Director for "${input.brandName}" (${input.business}).`,
            `Refine the Brand DNA according to this instruction: "${input.instruction}".`,
            `Current Brand DNA: ${JSON.stringify(input.dna)}.`,
            `Rules: keep the same audience and personality traits; stay concise (each field one or two sentences);`,
            `keywords: 4-6 single words; the visual direction must stay compatible with the existing colour and typography.`,
            `Return only the refined fields listed in the schema.`,
          ].join("\n"),
        });
        return result.object;
      } catch (err) {
        throw toTrpcError(err);
      }
    }),

  /** AI Studio → WRITE: headlines, captions, CTAs from the brand voice. */
  studioCopy: authedQuery
    .input(
      z.object({
        brandName: z.string(),
        dna: z.custom<BrandDNA>((v) => typeof v === "object" && v !== null),
        voice: z.custom<VoiceSystem>((v) => typeof v === "object" && v !== null),
        channel: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireEntitlement(ctx.user.id, "ai_studio");
      try {
        const model = await defaultModel();
        const result = await generateObject({
          model,
          schema: copySchema,
          prompt: [
            `Write brand copy for "${input.brandName}".`,
            `Brand DNA: ${JSON.stringify(input.dna)}.`,
            `Brand voice: ${JSON.stringify({ tone: input.voice.tone, vocabulary: input.voice.vocabulary, principles: input.voice.principles, dos: input.voice.dos, donts: input.voice.donts })}.`,
            input.channel ? `Channel/context: ${input.channel}.` : "",
            `Produce up to 5 headlines, 5 short captions and 5 CTAs that strictly follow the tone of voice.`,
            `No emojis unless the voice allows it. Headlines max 10 words. Captions max 25 words.`,
          ].join("\n"),
        });
        return result.object;
      } catch (err) {
        throw toTrpcError(err);
      }
    }),
});
