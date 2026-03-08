import { describe, expect, it } from "vitest";

import {
  AI_MODEL_CATALOG,
  AI_PROVIDER_CATALOG,
  getAllAIModelIds,
  getDefaultModelForProvider,
  getModelCatalogForProvider,
  getModelDefinition,
  getProviderDefinition,
  isModelSupportedByProvider,
} from "./models";

describe("AI model catalog", () => {
  it("exposes the supported providers in a stable order", () => {
    expect(AI_PROVIDER_CATALOG.map((provider) => provider.id)).toEqual([
      "openai",
      "anthropic",
      "google",
      "openrouter",
    ]);
  });

  it("has a default model for every provider", () => {
    for (const provider of AI_PROVIDER_CATALOG) {
      expect(getDefaultModelForProvider(provider.id)).toBeTruthy();
    }
  });

  it("returns only models that belong to the requested provider", () => {
    const anthropicModels = getModelCatalogForProvider("anthropic");

    expect(anthropicModels.length).toBeGreaterThan(0);
    expect(anthropicModels.every((model) => model.provider === "anthropic")).toBe(true);
    expect(anthropicModels.some((model) => model.id === "claude-sonnet-4-6")).toBe(true);
    expect(anthropicModels.some((model) => model.id === "gpt-5")).toBe(false);
  });

  it("flattens all model ids for backend validation", () => {
    const modelIds = getAllAIModelIds();

    expect(modelIds).toContain("gpt-5");
    expect(modelIds).toContain("claude-sonnet-4-6");
    expect(modelIds).toContain("gemini-2.5-flash");
    expect(modelIds).toContain("openai/gpt-5.4");
    expect(new Set(modelIds).size).toBe(modelIds.length);
  });

  it("keeps definitions discoverable by provider and id", () => {
    expect(getProviderDefinition("google")?.label).toBe("Google");
    expect(getModelDefinition("anthropic/claude-sonnet-4.6")?.provider).toBe("openrouter");
    expect(isModelSupportedByProvider("openrouter", "anthropic/claude-sonnet-4.6")).toBe(true);
    expect(isModelSupportedByProvider("openai", "claude-sonnet-4-6")).toBe(false);
  });

  it("does not drift between the flat list and the grouped catalog", () => {
    const groupedIds = AI_MODEL_CATALOG.flatMap((group) =>
      group.series.flatMap((series) => series.models.map((model) => model.id))
    );

    expect(groupedIds).toEqual(getAllAIModelIds());
  });
});
