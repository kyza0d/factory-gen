import { NodeMetadata } from "../types";

export const AIMetadata: NodeMetadata = {
  type: "AI",
  label: "AI Processing",
  description: "Processes text using an AI model.",
  uiComponent: "AI",
  inputs: [
    {
      id: "ai-input-1",
      name: "source",
      type: "string",
      description: "The source text to process",
      defaultValue: null,
      options: null,
    },
  ],
  outputs: [
    {
      id: "ai-output-1",
      name: "result",
      type: "string",
      description: "The result of the AI processing",
      defaultValue: null,
      options: null,
    },
  ],
  parameters: [
    {
      id: "ai-param-1",
      name: "systemPrompt",
      type: "string",
      description: "Instructions for the AI",
      defaultValue: "You are a helpful AI.",
      options: null,
      enabled: true,
    },
    {
      id: "ai-param-2",
      name: "model",
      type: "string",
      description: "The LLM to use",
      defaultValue: "gpt-4o",
      options: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
      enabled: true,
    },
  ],
  modules: [],
};
