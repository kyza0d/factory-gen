import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { type AIProviderId } from "@registry/ai/models";

import { openrouter } from "../../lib/openrouter";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const requireEnv = (providerLabel: string, key: string) => {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} for ${providerLabel} provider`);
  }
};

export function getLanguageModelForProvider(provider: AIProviderId, model: string): LanguageModel {
  switch (provider) {
    case "openai":
      requireEnv("OpenAI", "OPENAI_API_KEY");
      return openai(model);
    case "anthropic":
      requireEnv("Anthropic", "ANTHROPIC_API_KEY");
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })(model);
    case "google":
      requireEnv("Google", "GOOGLE_GENERATIVE_AI_API_KEY");
      return google(model);
    case "openrouter":
      requireEnv("OpenRouter", "OPENROUTER_API_KEY");
      return openrouter(model);
  }
}
