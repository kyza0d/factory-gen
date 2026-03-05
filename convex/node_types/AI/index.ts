import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { AIMetadata } from "@registry/nodes/ai";

export const AINode: NodeDefinition = {
  ...AIMetadata,
  execute: async (_ctx: ActionCtx, { inputs, params }) => {
    const systemPrompt = params["systemPrompt"] || "You are a helpful AI.";
    const modelName = params["model"] || "gpt-4o";
    const aiInput = inputs["source"] || inputs["default"] || "No input provided for AI";

    const { text } = await generateText({
      model: openai(modelName as string || "gpt-4o"),
      system: systemPrompt as string,
      prompt: aiInput as string,
    });

    return text;
  },
};
