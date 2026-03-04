import { describe, it, expect, vi } from "vitest";
import { createWorkflowHandler } from "../node_operations";
import { MutationCtx } from "../_generated/server";

describe("Multi-Workflow Management", () => {
  it("creates a workflow associated with a file", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([]),
          }),
        }),
        insert: vi.fn().mockResolvedValue("wf-db-id"),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const workflowData = {
      id: "wf-1",
      name: "Test Workflow",
      nodes: [],
      edges: [],
      fileId: "file-1" as any,
    };

    await createWorkflowHandler(mockCtx, { workflow: workflowData });

    // Verify workflow insertion
    expect(mockCtx.db.insert).toHaveBeenCalledWith("workflows", {
      id: "wf-1",
      name: "Test Workflow",
      description: undefined,
      fileId: "file-1",
    });
  });

  it("handles multiple workflows without interference", async () => {
    // This is more of an integration test, but we can mock the behavior
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockImplementation((q) => ({
             first: vi.fn().mockResolvedValue(null)
          })),
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([]),
          }),
        }),
        insert: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    const wf1 = { id: "wf-1", name: "WF 1", nodes: [], edges: [], fileId: "file-1" as any };
    const wf2 = { id: "wf-2", name: "WF 2", nodes: [], edges: [], fileId: "file-2" as any };

    await createWorkflowHandler(mockCtx, { workflow: wf1 });
    await createWorkflowHandler(mockCtx, { workflow: wf2 });

    expect(mockCtx.db.insert).toHaveBeenCalledWith("workflows", expect.objectContaining({ id: "wf-1", fileId: "file-1" }));
    expect(mockCtx.db.insert).toHaveBeenCalledWith("workflows", expect.objectContaining({ id: "wf-2", fileId: "file-2" }));
  });
});
