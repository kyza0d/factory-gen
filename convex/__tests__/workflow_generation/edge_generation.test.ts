import { describe, it, expect, vi } from "vitest";
import { MutationCtx } from "../../_generated/server";
import {
  buildSequentialEdges,
  createGeneratedEdgesHandler,
  type NodeWithStepIndex,
} from "../../workflow_generation";

// ─── Edge Generation Phase ─────────────────────────────────────────────────────
//
// After all nodes are inserted, the final phase connects them with edges.
// For a linear workflow [A → B → C], we produce edges [A→B, B→C].
// Each edge uses the first output port of the source node and the first input
// port of the target node, which matches registry defaults.

describe("buildSequentialEdges", () => {
  const makeNode = (id: string, stepIndex: number, outputId = "out-1", inputId = "in-1"): NodeWithStepIndex => ({
    id,
    stepIndex,
    outputs: [{ id: outputId, name: "output", type: "string", description: "", defaultValue: null, options: null, enabled: true }],
    inputs: [{ id: inputId, name: "input", type: "string", description: "", defaultValue: null, options: null, enabled: true }],
  });

  it("returns empty array for 0 nodes", () => {
    expect(buildSequentialEdges([])).toEqual([]);
  });

  it("returns empty array for 1 node", () => {
    expect(buildSequentialEdges([makeNode("n1", 0)])).toEqual([]);
  });

  it("returns 1 edge for 2 nodes", () => {
    const edges = buildSequentialEdges([makeNode("n1", 0), makeNode("n2", 1)]);
    expect(edges).toHaveLength(1);
  });

  it("returns N-1 edges for N nodes", () => {
    const nodes = [0, 1, 2, 3, 4].map((i) => makeNode(`n${i}`, i));
    const edges = buildSequentialEdges(nodes);
    expect(edges).toHaveLength(4);
  });

  it("connects source output to target input using port ids", () => {
    const nodes = [
      makeNode("n1", 0, "out-a", "in-x"),
      makeNode("n2", 1, "out-b", "in-y"),
    ];
    const edges = buildSequentialEdges(nodes);

    expect(edges[0]).toMatchObject({
      source: "n1",
      sourceHandle: "out-a",
      target: "n2",
      targetHandle: "in-y",
    });
  });

  it("orders by stepIndex, not array insertion order", () => {
    // Steps provided out of order
    const nodes = [
      makeNode("n2", 1, "out-b", "in-y"),
      makeNode("n1", 0, "out-a", "in-x"),
    ];
    const edges = buildSequentialEdges(nodes);

    // n1 (step 0) should be source, n2 (step 1) should be target
    expect(edges[0].source).toBe("n1");
    expect(edges[0].target).toBe("n2");
  });

  it("handles nodes with no output ports gracefully (uses null sourceHandle)", () => {
    const nodeWithNoOutputs: NodeWithStepIndex = {
      id: "n1",
      stepIndex: 0,
      outputs: [],
      inputs: [],
    };
    const nodeB = makeNode("n2", 1);

    const edges = buildSequentialEdges([nodeWithNoOutputs, nodeB]);
    expect(edges[0].sourceHandle).toBeNull();
  });

  it("each edge has a unique id", () => {
    const nodes = [0, 1, 2].map((i) => makeNode(`n${i}`, i));
    const edges = buildSequentialEdges(nodes);
    const ids = edges.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("createGeneratedEdgesHandler", () => {
  it("inserts one edge record per sequential pair", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("edge-id") },
    } as unknown as MutationCtx;

    const edges = [
      { id: "e-1", workflowId: "wf-1", source: "n1", sourceHandle: "out-1", target: "n2", targetHandle: "in-1" },
      { id: "e-2", workflowId: "wf-1", source: "n2", sourceHandle: "out-1", target: "n3", targetHandle: "in-1" },
    ];

    await createGeneratedEdgesHandler(mockCtx, { edges });

    expect(mockCtx.db.insert).toHaveBeenCalledTimes(2);
    expect(mockCtx.db.insert).toHaveBeenCalledWith("edges", expect.objectContaining({ id: "e-1" }));
    expect(mockCtx.db.insert).toHaveBeenCalledWith("edges", expect.objectContaining({ id: "e-2" }));
  });

  it("inserts edges with correct workflowId", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("edge-id") },
    } as unknown as MutationCtx;

    const edges = [
      { id: "e-1", workflowId: "wf-xyz", source: "n1", sourceHandle: null, target: "n2", targetHandle: null },
    ];

    await createGeneratedEdgesHandler(mockCtx, { edges });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "edges",
      expect.objectContaining({ workflowId: "wf-xyz" })
    );
  });

  it("no-ops for empty edges array", async () => {
    const mockCtx = {
      db: { insert: vi.fn() },
    } as unknown as MutationCtx;

    await createGeneratedEdgesHandler(mockCtx, { edges: [] });

    expect(mockCtx.db.insert).not.toHaveBeenCalled();
  });
});
