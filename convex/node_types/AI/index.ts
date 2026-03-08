import { generateText } from "ai";
import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { AIMetadata } from "@registry/nodes/ai";
import { normalizeAISelection } from "./config";
import { getLanguageModelForProvider } from "./provider";

export const AINode: NodeDefinition = {
  ...AIMetadata,
  execute: async (_ctx: ActionCtx, { inputs, params }) => {
    const systemPrompt = params["systemPrompt"] || "You are a helpful AI.";
    const { provider, model } = normalizeAISelection({
      provider: params["provider"],
      model: params["model"],
    });
    const aiInput = inputs["source"] || inputs["default"] || "No input provided for AI";

    const { text } = await generateText({
      model: getLanguageModelForProvider(provider, model),
      system: systemPrompt as string,
      prompt: aiInput as string,
      ...(provider === "openrouter"
        ? {
            providerOptions: {
              openai: {
                extraBody: {
                  reasoning_effort: "instant",
                },
              },
            },
          }
        : {}),
    });

    return text;
  },
};
