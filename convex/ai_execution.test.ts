import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWorkflowHandler } from "./ai";
import { ActionCtx } from "./_generated/server";
import { UINode, IOParam } from "./schema/nodes";

vi.mock("ai", () => ({
  generateText: vi.fn(({ system, prompt }) => Promise.resolve({
    text: `AI response to "${prompt}" with system prompt: "${system}"`,
  })),
  Output: {
    object: vi.fn((_) => ({})),
  },
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));

describe("Workflow Execution Convex Action", () => {
  const mockNodes: any[] = [
    {
      id: "node-1",
      type: "UserInput",
      label: "User Input",
      inputs: [],
      outputs: [{ id: "out-1", name: "input", type: "string", description: "User input text" }],
      parameters: [],
      modules: [{ id: "mod-1", type: "text", label: "Enter text", value: "Hello from user!" }], 
    },
    {
      id: "node-2",
      type: "AIModule",
      label: "AI Refiner",
      inputs: [{ id: "in-1", name: "source", type: "string", description: "Input to refine" }],
      outputs: [{ id: "out-2", name: "result", type: "string", description: "Refined output" }],
      parameters: [
        { id: "param-1", name: "systemPrompt", type: "string", description: "AI instructions", defaultValue: "Refine this text." },
      ], 
      modules: [],
    },
    {
      id: "node-3",
      type: "PreviewOutput",
      label: "Preview Output",
      inputs: [{ id: "in-2", name: "content", type: "string", description: "Content to display" }],
      outputs: [],
      parameters: [],
      modules: [],
    },
  ];

  const mockEdges = [
    { id: "edge-1", source: "node-1", sourceHandle: "out-1", target: "node-2", targetHandle: "in-1" },
    { id: "edge-2", source: "node-2", sourceHandle: "out-2", target: "node-3", targetHandle: "in-2" },
  ];

  const mockCtx = {
    runQuery: vi.fn().mockResolvedValue({
      nodes: mockNodes,
      edges: mockEdges,
    }),
  } as unknown as ActionCtx;

  it("successfully executes a workflow and passes data through links", async () => {
    // Note: Current implementation is expected to fail this test's specific expectations
    // because it doesn't correctly map handles or use modules for UserInput.
    const result = await executeWorkflowHandler(mockCtx, { workflowId: "test-wf" });

    expect(result.events).toHaveLength(6); // 3 nodes, each start and completed
    
    // Check if the final output corresponds to the processed input
    // The current implementation will likely fail this or return the default "Default User Input"
    // because it looks at parameters instead of modules for UserInput.
    
    // We expect the final output to be something like:
    // "Processed by AI: Hello from user! (via gpt-4o with prompt: "Refine this text.")"
    // (Based on current placeholder AI logic in ai.ts)
    
    expect(result.finalOutput).toContain("Hello from user!");
    expect(result.finalOutput).toContain("Refine this text.");
  });
});
