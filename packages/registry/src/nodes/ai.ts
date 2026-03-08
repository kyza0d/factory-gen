import { NodeMetadata } from "../types";
import { AI_PROVIDER_CATALOG, DEFAULT_AI_PROVIDER, getAllAIModelIds, getDefaultModelForProvider } from "../ai/models";

export const AIMetadata: NodeMetadata = {
  type: "AI",
  label: "AI Processing",
  description: "Processes text using an AI model.",
  icon: "FaAtom",
  uiComponent: "AI",
  inputs: [
    {
      id: "ai-input-1",
      name: "source",
      type: "string",
      description: "The source text to process",
      defaultValue: null,
      options: null,
      enabled: true,
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
      enabled: true,
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
      name: "provider",
      type: "string",
      description: "The AI provider to use",
      defaultValue: DEFAULT_AI_PROVIDER,
      options: AI_PROVIDER_CATALOG.map((provider) => provider.id),
      enabled: true,
    },
    {
      id: "ai-param-3",
      name: "model",
      type: "string",
      description: "The LLM to use",
      defaultValue: getDefaultModelForProvider(DEFAULT_AI_PROVIDER),
      options: getAllAIModelIds(),
      enabled: true,
    },
  ],
  modules: [],
};
