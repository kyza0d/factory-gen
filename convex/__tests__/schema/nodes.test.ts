import { describe, it, expect } from "vitest";
import { UINodeSchema, IOParamSchema } from "../../schema/nodes";

describe("UI Node Schemas", () => {
  it("validates a valid IOParam", () => {
    const validIO = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Input 1",
      type: "string",
      description: "A test input",
      defaultValue: null,
      options: null,
    };
    const result = IOParamSchema.safeParse(validIO);
    expect(result.success).toBe(true);
  });

  it("fails validation for an invalid IOParam", () => {
    const invalidIO = {
      id: "invalid-uuid",
      name: "",
      type: "invalid-type",
    };
    const result = IOParamSchema.safeParse(invalidIO);
    expect(result.success).toBe(false);
  });

  it("validates a complete UI node", () => {
    const validNode = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      type: "TextSummarizer",
      label: "Summarizer Node",
      inputs: [
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "text",
          type: "string",
          description: "Input text to summarize",
          defaultValue: null,
          options: null,
        },
      ],
      outputs: [
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          name: "summary",
          type: "string",
          description: "The summarized text",
          defaultValue: null,
          options: null,
        },
      ],
      parameters: [
        {
          id: "550e8400-e29b-41d4-a716-446655440004",
          name: "maxLength",
          type: "number",
          defaultValue: 100,
          description: "Maximum length of the summary",
          options: null,
        },
      ],
      uiComponent: "TextSummarizerNode",
    };
    const result = UINodeSchema.safeParse(validNode);
    expect(result.success).toBe(true);
  });

  it("fails validation for a UI node with missing required fields", () => {
    const invalidNode = {
      id: "550e8400-e29b-41d4-a716-446655440005",
      type: "InvalidNode",
      // label missing
    };
    const result = UINodeSchema.safeParse(invalidNode);
    expect(result.success).toBe(false);
  });
});
