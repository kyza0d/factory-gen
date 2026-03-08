import { describe, expect, it } from "vitest";

import { normalizeAISelection } from "../../node_types/AI/config";

describe("normalizeAISelection", () => {
  it("uses the configured provider and model when they match", () => {
    expect(
      normalizeAISelection({
        provider: "anthropic",
        model: "claude-sonnet-4-6",
      })
    ).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-6",
    });
  });

  it("falls back to the provider default model when the model belongs to another provider", () => {
    expect(
      normalizeAISelection({
        provider: "google",
        model: "gpt-5",
      })
    ).toEqual({
      provider: "google",
      model: "gemini-2.5-flash",
    });
  });

  it("falls back to the default provider when the provider is missing", () => {
    expect(
      normalizeAISelection({
        provider: undefined,
        model: "claude-sonnet-4-6",
      })
    ).toEqual({
      provider: "openrouter",
      model: "inception/mercury-2",
    });
  });
});
