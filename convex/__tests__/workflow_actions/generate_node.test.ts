import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateNodeHandler } from "../../workflow_actions";
import { UINodeSchema, UINode } from "@registry/types";
import { ActionCtx } from "../../_generated/server";

// Mock the Convex action context and arguments
const mockCtx: ActionCtx = {
  // Mock any properties of ActionCtx that are used by generateNodeHandler
  // In this case, generateNodeHandler does not use any ctx properties
  // so an empty object is sufficient.
  environment: { OPENAI_API_KEY: "test-key" }, // Add a mock API key for the test to pass
} as unknown as ActionCtx;

// Mock the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(() => Promise.resolve({
    output: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      type: "TextSummarizer",
      label: "Summarizer Node",
      inputs: [],
      outputs: [],
      parameters: [],
      agentDefinitionId: null,
      uiComponent: "TextSummarizerNode",
      position: { x: 0, y: 0 },
      modules: [],
    } as UINode,
  })),
  Output: {
    object: vi.fn(() => ({})),
  },
}));

// Mock the OpenAI provider
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));

describe("AI Generation Convex Action", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates a Zod-safe UI node from a prompt", async () => {
    // Call the handler directly for unit testing
    const result: UINode = await generateNodeHandler(mockCtx, {
      prompt: "Create a summarizer node",
    });

    // We don't need to mock generateObject again as it's already mocked globally
    const { generateText } = await import("ai");
    const mockResponse = (await generateText({} as any)).output;

    expect(result).toEqual(mockResponse);
    expect(UINodeSchema.safeParse(result).success).toBe(true);
  });

  it("throws error if OPENAI_API_KEY is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    await expect(
      generateNodeHandler(mockCtx, {
        prompt: "Create a summarizer node",
      })
    ).rejects.toThrow("OPENAI_API_KEY is not configured");
  });
});
