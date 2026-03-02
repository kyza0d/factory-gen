import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateWorkflowHandler } from "./ai";
import { WorkflowGraphSchema, WorkflowGraph, UINode, IOParam } from "./schema/nodes"; // Import WorkflowGraph
import { ActionCtx } from "./_generated/server";

const mockCtx: ActionCtx = {} as unknown as ActionCtx;

vi.mock("ai", () => ({
  generateText: vi.fn(() => Promise.resolve({
    output: {
      id: "wf-1",
      name: "Text Refinement Workflow",
      description: "A workflow for refining text using AI.",
      nodes: [
        {
          id: "node-1",
          type: "UserInput",
          label: "User Input",
          inputs: [],
          outputs: [{ id: "out-1", name: "input", type: "string", description: "User input text", defaultValue: null, options: null }],
          parameters: [],
          agentDefinitionId: null,
          uiComponent: "UserInputNode",
          modules: [{ id: "mod-1", type: "text", label: "Enter text", value: null }], 
        } as UINode,
        {
          id: "node-2",
          type: "AIModule",
          label: "AI Refiner",
          inputs: [{ id: "in-1", name: "source", type: "string", description: "Input to refine", defaultValue: null, options: null }],
          outputs: [{ id: "out-2", name: "result", type: "string", description: "Refined output", defaultValue: null, options: null }],
          parameters: [
            { id: "param-1", name: "systemPrompt", type: "string", description: "AI instructions", defaultValue: "Refine this text.", options: null },
          ] as IOParam[], 
          agentDefinitionId: null,
          uiComponent: "AIModuleNode",
          modules: [],
        } as UINode,
        {
          id: "node-3",
          type: "PreviewOutput",
          label: "Preview Output",
          inputs: [{ id: "in-2", name: "content", type: "string", description: "Content to display", defaultValue: null, options: null }],
          outputs: [],
          parameters: [],
          agentDefinitionId: null,
          uiComponent: "PreviewOutputNode",
          modules: [],
        } as UINode,
      ],
      edges: [
        { id: "edge-1", source: "node-1", sourceHandle: "out-1", target: "node-2", targetHandle: "in-1" },
        { id: "edge-2", source: "node-2", sourceHandle: "out-2", target: "node-3", targetHandle: "in-2" },
      ],
    } as WorkflowGraph,
  })),
  Output: {
    object: vi.fn((_) => ({})),
  },
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));

describe("AI Workflow Generation Convex Action", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates a Zod-safe workflow graph from a prompt", async () => {
    // Call the handler directly for unit testing
    const prompt = "create a workflow for refining text";
    const result: WorkflowGraph = await generateWorkflowHandler(mockCtx, { prompt });

    // We don't need to mock generateObject again as it's already mocked globally
    const { generateText } = await import("ai");
    const mockResponse = (await (generateText as any)({})).output;

    expect(result).toEqual(mockResponse);
    expect(WorkflowGraphSchema.safeParse(result).success).toBe(true);
  });
});
