import { createOpenAI } from "@ai-sdk/openai";

type OpenRouterExtraBody = {
  provider?: {
    require_parameters?: boolean;
  };
  reasoning_effort?: string;
};

const withExtraBody = (extraBody: OpenRouterExtraBody) => async (input: RequestInfo | URL, init?: RequestInit) => {
  if (!init?.body || typeof init.body !== "string") {
    return fetch(input, init);
  }

  const body = JSON.parse(init.body) as Record<string, unknown>;
  const mergedProvider = {
    ...(typeof body.provider === "object" && body.provider !== null ? body.provider as Record<string, unknown> : {}),
    ...(extraBody.provider ?? {}),
  };

  const nextBody = {
    ...body,
    ...extraBody,
    ...(Object.keys(mergedProvider).length > 0 ? { provider: mergedProvider } : {}),
  };

  return fetch(input, {
    ...init,
    body: JSON.stringify(nextBody),
  });
};

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": "Factory Gen",
  },
});

export const openrouterMercury = (reasoningEffort: "instant" | "low" | "medium" | "high") =>
  createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
      "X-Title": "Factory Gen",
    },
    fetch: withExtraBody({
      reasoning_effort: reasoningEffort,
      provider: {
        require_parameters: true,
      },
    }),
  })("inception/mercury-2");
