import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AIProvider = "google" | "anthropic" | "openai";

export function getModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER || "google") as AIProvider;

  switch (provider) {
    case "google":
      return google("gemini-2.5-flash");
    case "anthropic":
      return anthropic("claude-sonnet-4-5");
    case "openai":
      return openai("gpt-4o-mini");
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
}
