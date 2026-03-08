export type AIProviderId = "openai" | "anthropic" | "google" | "openrouter";

export interface AIProviderDefinition {
  id: AIProviderId;
  label: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  defaultModelId: string;
}

export interface AIModelDefinition {
  id: string;
  label: string;
  provider: AIProviderId;
  description: string;
}

export interface AIModelSeries {
  id: string;
  label: string;
  models: AIModelDefinition[];
}

export interface AIModelGroup {
  provider: AIProviderId;
  label: string;
  series: AIModelSeries[];
}

export const DEFAULT_AI_PROVIDER: AIProviderId = "openrouter";

export const AI_PROVIDER_CATALOG: AIProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "Direct OpenAI models using official API ids.",
    sourceLabel: "OpenAI Models",
    sourceUrl: "https://developers.openai.com/api/docs/models",
    defaultModelId: "gpt-5-mini",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Direct Claude models using Anthropic API aliases.",
    sourceLabel: "Anthropic Models Overview",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/models/overview",
    defaultModelId: "claude-sonnet-4-6",
  },
  {
    id: "google",
    label: "Google",
    description: "Direct Gemini models curated from the Gemini API model guide.",
    sourceLabel: "Gemini API Models",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/models",
    defaultModelId: "gemini-2.5-flash",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "OpenRouter model ids curated from the Models API and model pages.",
    sourceLabel: "OpenRouter Models API",
    sourceUrl: "https://openrouter.ai/docs/guides/overview/models",
    defaultModelId: "inception/mercury-2",
  },
];

export const AI_MODEL_CATALOG: AIModelGroup[] = [
  {
    provider: "openai",
    label: "OpenAI",
    series: [
      {
        id: "gpt-5",
        label: "GPT-5 Series",
        models: [
          {
            id: "gpt-5.4",
            label: "GPT-5.4",
            provider: "openai",
            description: "Latest frontier model for professional work.",
          },
          {
            id: "gpt-5",
            label: "GPT-5",
            provider: "openai",
            description: "Reasoning model for coding and agentic tasks.",
          },
          {
            id: "gpt-5-mini",
            label: "GPT-5 Mini",
            provider: "openai",
            description: "Faster and more cost-efficient GPT-5 variant.",
          },
          {
            id: "gpt-5-nano",
            label: "GPT-5 Nano",
            provider: "openai",
            description: "Fastest and cheapest GPT-5 tier.",
          },
        ],
      },
      {
        id: "gpt-4-1",
        label: "GPT-4.1 Series",
        models: [
          {
            id: "gpt-4.1",
            label: "GPT-4.1",
            provider: "openai",
            description: "Strong non-reasoning general model.",
          },
          {
            id: "gpt-4.1-mini",
            label: "GPT-4.1 Mini",
            provider: "openai",
            description: "Smaller GPT-4.1 variant for lower latency.",
          },
        ],
      },
    ],
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    series: [
      {
        id: "claude-4-6",
        label: "Claude 4.6",
        models: [
          {
            id: "claude-opus-4-6",
            label: "Claude Opus 4.6",
            provider: "anthropic",
            description: "Most capable Claude model for complex work.",
          },
          {
            id: "claude-sonnet-4-6",
            label: "Claude Sonnet 4.6",
            provider: "anthropic",
            description: "Best speed and intelligence balance in Claude.",
          },
        ],
      },
      {
        id: "claude-4-5",
        label: "Claude 4.5",
        models: [
          {
            id: "claude-haiku-4-5",
            label: "Claude Haiku 4.5",
            provider: "anthropic",
            description: "Fastest Claude tier with near-frontier performance.",
          },
        ],
      },
    ],
  },
  {
    provider: "google",
    label: "Google",
    series: [
      {
        id: "gemini-2-5",
        label: "Gemini 2.5",
        models: [
          {
            id: "gemini-2.5-pro",
            label: "Gemini 2.5 Pro",
            provider: "google",
            description: "Google's advanced model for reasoning and coding.",
          },
          {
            id: "gemini-2.5-flash",
            label: "Gemini 2.5 Flash",
            provider: "google",
            description: "Best price-performance for low-latency reasoning.",
          },
          {
            id: "gemini-2.5-flash-lite",
            label: "Gemini 2.5 Flash-Lite",
            provider: "google",
            description: "Fastest and most budget-friendly Gemini 2.5 model.",
          },
        ],
      },
    ],
  },
  {
    provider: "openrouter",
    label: "OpenRouter",
    series: [
      {
        id: "openrouter-featured",
        label: "Featured",
        models: [
          {
            id: "inception/mercury-2",
            label: "Mercury 2",
            provider: "openrouter",
            description: "Current project default and high-speed reasoning choice.",
          },
        ],
      },
      {
        id: "openai-via-openrouter",
        label: "OpenAI via OpenRouter",
        models: [
          {
            id: "openai/gpt-5.4",
            label: "GPT-5.4",
            provider: "openrouter",
            description: "OpenAI frontier model routed through OpenRouter.",
          },
          {
            id: "openai/gpt-5-mini",
            label: "GPT-5 Mini",
            provider: "openrouter",
            description: "Cost-efficient GPT-5 variant via OpenRouter.",
          },
        ],
      },
      {
        id: "anthropic-via-openrouter",
        label: "Anthropic via OpenRouter",
        models: [
          {
            id: "anthropic/claude-opus-4.6",
            label: "Claude Opus 4.6",
            provider: "openrouter",
            description: "Anthropic flagship via OpenRouter.",
          },
          {
            id: "anthropic/claude-sonnet-4.6",
            label: "Claude Sonnet 4.6",
            provider: "openrouter",
            description: "Anthropic balance model via OpenRouter.",
          },
        ],
      },
      {
        id: "google-via-openrouter",
        label: "Google via OpenRouter",
        models: [
          {
            id: "google/gemini-2.5-pro",
            label: "Gemini 2.5 Pro",
            provider: "openrouter",
            description: "Google reasoning model via OpenRouter.",
          },
          {
            id: "google/gemini-2.5-flash",
            label: "Gemini 2.5 Flash",
            provider: "openrouter",
            description: "Google latency-optimized model via OpenRouter.",
          },
        ],
      },
    ],
  },
];

export const getProviderDefinition = (providerId: string | null | undefined) =>
  AI_PROVIDER_CATALOG.find((provider) => provider.id === providerId);

export const getModelCatalogForProvider = (providerId: AIProviderId): AIModelDefinition[] =>
  AI_MODEL_CATALOG
    .find((group) => group.provider === providerId)
    ?.series.flatMap((series) => series.models) ?? [];

export const getModelGroupForProvider = (providerId: AIProviderId) =>
  AI_MODEL_CATALOG.find((group) => group.provider === providerId);

export const getModelDefinition = (modelId: string | null | undefined) =>
  AI_MODEL_CATALOG.flatMap((group) => group.series)
    .flatMap((series) => series.models)
    .find((model) => model.id === modelId);

export const getModelLabel = (modelId: string | null | undefined) =>
  getModelDefinition(modelId)?.label ?? (typeof modelId === "string" ? modelId : "");

export const getDefaultModelForProvider = (providerId: AIProviderId) =>
  getProviderDefinition(providerId)?.defaultModelId ?? getProviderDefinition(DEFAULT_AI_PROVIDER)?.defaultModelId ?? "inception/mercury-2";

export const getAllAIModelIds = () =>
  AI_MODEL_CATALOG.flatMap((group) => group.series.flatMap((series) => series.models.map((model) => model.id)));

export const isAIProvider = (value: string | null | undefined): value is AIProviderId =>
  AI_PROVIDER_CATALOG.some((provider) => provider.id === value);

export const isModelSupportedByProvider = (providerId: AIProviderId, modelId: string | null | undefined) =>
  getModelCatalogForProvider(providerId).some((model) => model.id === modelId);
