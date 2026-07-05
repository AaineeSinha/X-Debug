import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import type { AnalysisResult, DebugLanguage } from "./types";

const InputSchema = z.object({
  language: z.enum(["python", "c"]),
  code: z.string().min(1).max(20000),
});

export const analyzeCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { buildSystemPrompt, buildUserPrompt, normalizeAnalysis, parseJsonLoose } = await import(
      "./engine.server"
    );

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const language = data.language as DebugLanguage;

    try {
      const { text } = await generateText({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(language, data.code) },
        ],
      });
      const parsed = parseJsonLoose(text);
      if (!parsed) throw new Error("The engine returned an unreadable response. Please try again.");
      return normalizeAnalysis(parsed, data.code);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("429")) throw new Error("Rate limit reached. Please wait a moment and retry.");
      if (message.includes("402"))
        throw new Error("AI credits exhausted. Add credits in your workspace to keep analyzing.");
      throw new Error(message || "Analysis failed.");
    }
  });