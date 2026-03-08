import { describe, it, expect } from "vitest";
import { buildNodeSpec, mergeNodeWithRegistry } from "../../workflow_generation";
import { AIMetadata } from "@registry/nodes/ai";
import type { NodeMetadata, IOParam } from "@registry/types";

// ─── Registry Merge & Node Spec ────────────────────────────────────────────────
//
// These tests guard against the class of bug where the LLM generates structurally
// incomplete nodes (missing `options`, wrong `id`, empty `defaultValue`) because
// the prompt spec or the post-generation merge is incorrect.
//
// The core invariant: registry fields (id, options, type, description) must always
// win over LLM output; only LLM-generated `defaultValue` is allowed to propagate.

// ─── AI node registry definition ───────────────────────────────────────────────

describe("AIMetadata registry definition", () => {
  it("has a 'model' parameter with a non-null options array", () => {
    const modelParam = AIMetadata.parameters?.find((p) => p.name === "model");
    expect(modelParam).toBeDefined();
    expect(Array.isArray(modelParam?.options)).toBe(true);
    expect((modelParam?.options ?? []).length).toBeGreaterThan(0);
  });

  it("'model' options include at least one gpt-4o variant", () => {
    const modelParam = AIMetadata.parameters?.find((p) => p.name === "model");
    expect(modelParam?.options?.some((o) => o.startsWith("gpt-4"))).toBe(true);
  });

  it("has a 'systemPrompt' parameter with a non-empty defaultValue", () => {
    const promptParam = AIMetadata.parameters?.find((p) => p.name === "systemPrompt");
    expect(promptParam).toBeDefined();
    expect(typeof promptParam?.defaultValue).toBe("string");
    expect((promptParam?.defaultValue as string).length).toBeGreaterThan(0);
  });

  it("has stable canonical IDs for parameters", () => {
    const ids = AIMetadata.parameters?.map((p) => p.id) ?? [];
    expect(ids).toContain("ai-param-1");
    expect(ids).toContain("ai-param-2");
  });

  it("has exactly one input and one output", () => {
    expect(AIMetadata.inputs).toHaveLength(1);
    expect(AIMetadata.outputs).toHaveLength(1);
  });
});

// ─── buildNodeSpec ─────────────────────────────────────────────────────────────

describe("buildNodeSpec", () => {
  it("falls back to 'Type: X' for an unknown node type", () => {
    expect(buildNodeSpec(undefined, "Unknown")).toBe("Type: Unknown");
  });

  it("includes 'options' for parameters so the LLM knows about dropdowns", () => {
    const spec = buildNodeSpec(AIMetadata, "AI");
    // The model param's options array should appear in the spec
    expect(spec).toContain("gpt-4o");
    expect(spec).toContain("gpt-4-turbo");
    expect(spec).toContain("gpt-3.5-turbo");
  });

  it("includes 'defaultValue' for parameters so the LLM knows starting values", () => {
    const spec = buildNodeSpec(AIMetadata, "AI");
    expect(spec).toContain("You are a helpful AI.");
    expect(spec).toContain("gpt-4o"); // model defaultValue
  });

  it("includes canonical 'id' for parameters so the LLM can echo them back", () => {
    const spec = buildNodeSpec(AIMetadata, "AI");
    expect(spec).toContain("ai-param-1");
    expect(spec).toContain("ai-param-2");
  });

  it("includes canonical 'id' for inputs and outputs", () => {
    const spec = buildNodeSpec(AIMetadata, "AI");
    expect(spec).toContain("ai-input-1");
    expect(spec).toContain("ai-output-1");
  });

  it("includes the node type and label", () => {
    const spec = buildNodeSpec(AIMetadata, "AI");
    expect(spec).toContain("Type: AI");
    expect(spec).toContain("Label: AI Processing");
  });
});

// ─── mergeNodeWithRegistry ─────────────────────────────────────────────────────

/** Minimal IOParam factory for building LLM-like outputs in tests. */
function makeParam(overrides: Partial<IOParam> & { name: string }): IOParam {
  return {
    id: "llm-generated-id",
    type: "string",
    description: "",
    defaultValue: null,
    options: null,
    enabled: true,
    ...overrides,
  };
}

describe("mergeNodeWithRegistry — AI node", () => {
  const baseLLMOutput = {
    inputs: [makeParam({ name: "source", id: "llm-in-1" })],
    outputs: [makeParam({ name: "result", id: "llm-out-1" })],
    parameters: [
      makeParam({ name: "systemPrompt", id: "llm-p-1", options: null, defaultValue: null }),
      makeParam({ name: "model", id: "llm-p-2", options: null, defaultValue: null }),
    ],
  };

  it("restores registry options for the 'model' parameter when LLM omits them", () => {
    const { parameters } = mergeNodeWithRegistry(baseLLMOutput, AIMetadata);
    const model = parameters.find((p) => p.name === "model");
    expect(model?.options).toEqual(["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]);
  });

  it("restores registry defaultValue for 'systemPrompt' when LLM returns null", () => {
    const { parameters } = mergeNodeWithRegistry(baseLLMOutput, AIMetadata);
    const prompt = parameters.find((p) => p.name === "systemPrompt");
    expect(prompt?.defaultValue).toBe("You are a helpful AI.");
  });

  it("restores canonical IDs regardless of what the LLM generated", () => {
    const { parameters } = mergeNodeWithRegistry(baseLLMOutput, AIMetadata);
    const ids = parameters.map((p) => p.id);
    expect(ids).toContain("ai-param-1");
    expect(ids).toContain("ai-param-2");
    expect(ids).not.toContain("llm-p-1");
    expect(ids).not.toContain("llm-p-2");
  });

  it("restores canonical input id even when LLM generated a different one", () => {
    const { inputs } = mergeNodeWithRegistry(baseLLMOutput, AIMetadata);
    expect(inputs[0].id).toBe("ai-input-1");
    expect(inputs[0].id).not.toBe("llm-in-1");
  });

  it("restores canonical output id even when LLM generated a different one", () => {
    const { outputs } = mergeNodeWithRegistry(baseLLMOutput, AIMetadata);
    expect(outputs[0].id).toBe("ai-output-1");
  });

  it("preserves an LLM-generated systemPrompt defaultValue when it is non-null", () => {
    const llmWithPrompt = {
      ...baseLLMOutput,
      parameters: [
        makeParam({ name: "systemPrompt", defaultValue: "You are a pirate. Respond in pirate speak." }),
        makeParam({ name: "model", options: null, defaultValue: null }),
      ],
    };

    const { parameters } = mergeNodeWithRegistry(llmWithPrompt, AIMetadata);
    const prompt = parameters.find((p) => p.name === "systemPrompt");
    expect(prompt?.defaultValue).toBe("You are a pirate. Respond in pirate speak.");
  });

  it("preserves the LLM-chosen model defaultValue when it is non-null", () => {
    const llmWithModel = {
      ...baseLLMOutput,
      parameters: [
        makeParam({ name: "systemPrompt", defaultValue: null }),
        makeParam({ name: "model", defaultValue: "gpt-3.5-turbo" }),
      ],
    };

    const { parameters } = mergeNodeWithRegistry(llmWithModel, AIMetadata);
    const model = parameters.find((p) => p.name === "model");
    expect(model?.defaultValue).toBe("gpt-3.5-turbo");
    // But options must still come from registry
    expect(model?.options).toEqual(["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]);
  });

  it("all merged parameters have enabled: true", () => {
    const { parameters } = mergeNodeWithRegistry(baseLLMOutput, AIMetadata);
    parameters.forEach((p) => expect(p.enabled).toBe(true));
  });
});

describe("mergeNodeWithRegistry — unknown node type", () => {
  it("returns LLM output unchanged when nodeTypeDef is undefined", () => {
    const llmOutput = {
      inputs: [makeParam({ name: "x", id: "custom-in" })],
      outputs: [makeParam({ name: "y", id: "custom-out" })],
      parameters: [makeParam({ name: "z", id: "custom-p", options: ["a", "b"] })],
    };

    const merged = mergeNodeWithRegistry(llmOutput, undefined);
    expect(merged).toEqual(llmOutput);
  });
});

describe("mergeNodeWithRegistry — partial registry definition", () => {
  it("falls back to LLM inputs when registry has no inputs defined", () => {
    const partialRegistry: NodeMetadata = {
      type: "Custom",
      label: "Custom Node",
      // no inputs/outputs/parameters defined
    };

    const llmOutput = {
      inputs: [makeParam({ name: "src", id: "llm-in" })],
      outputs: [makeParam({ name: "dst", id: "llm-out" })],
      parameters: [makeParam({ name: "opt", id: "llm-p", options: ["x"] })],
    };

    const { inputs, outputs, parameters } = mergeNodeWithRegistry(llmOutput, partialRegistry);
    expect(inputs[0].id).toBe("llm-in");
    expect(outputs[0].id).toBe("llm-out");
    expect(parameters[0].options).toEqual(["x"]);
  });
});
