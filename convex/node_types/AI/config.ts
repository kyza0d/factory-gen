import {
  DEFAULT_AI_PROVIDER,
  getDefaultModelForProvider,
  isAIProvider,
  isModelSupportedByProvider,
  type AIProviderId,
} from "@registry/ai/models";

export interface AISelectionInput {
  provider?: unknown;
  model?: unknown;
}

export interface NormalizedAISelection {
  provider: AIProviderId;
  model: string;
}

export function normalizeAISelection(input: AISelectionInput): NormalizedAISelection {
  const requestedProvider = typeof input.provider === "string" ? input.provider : undefined;
  const provider: AIProviderId = isAIProvider(requestedProvider)
    ? requestedProvider
    : DEFAULT_AI_PROVIDER;

  const requestedModel = typeof input.model === "string" ? input.model : undefined;
  const model = requestedModel && isModelSupportedByProvider(provider, requestedModel)
    ? requestedModel
    : getDefaultModelForProvider(provider);

  return {
    provider,
    model,
  };
}
