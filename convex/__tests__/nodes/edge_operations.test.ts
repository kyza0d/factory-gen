import { describe, it, expect, vi } from "vitest";
import { createEdgeHandler, deleteEdgeHandler } from "../../nodes";
import { MutationCtx } from "../../_generated/server";

describe("Edge Operations", () => {
  // ─── createEdgeHandler ────────────────────────────────────────────────────

  describe("createEdgeHandler", () => {
    it("inserts a new edge and returns its db id", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]), // no existing edges
            }),
          }),
          insert: vi.fn().mockResolvedValue("edge-db-1"),
        },
      } as unknown as MutationCtx;

      const result = await createEdgeHandler(mockCtx, {
        id: "edge-uuid-1",
        workflowId: "wf-1",
        source: "node-1",
        sourceHandle: "out-port-1",
        target: "node-2",
        targetHandle: "in-port-1",
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith("edges", {
        id: "edge-uuid-1",
        workflowId: "wf-1",
        source: "node-1",
        sourceHandle: "out-port-1",
        target: "node-2",
        targetHandle: "in-port-1",
      });
      expect(result).toBe("edge-db-1");
    });

    it("throws when an identical edge (same source+target handles) already exists", async () => {
      const existingEdge = {
        _id: "edge-db-existing",
        id: "edge-existing",
        workflowId: "wf-1",
        source: "node-1",
        sourceHandle: "out-port-1",
        target: "node-2",
        targetHandle: "in-port-1",
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([existingEdge]),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        createEdgeHandler(mockCtx, {
          id: "edge-uuid-2",
          workflowId: "wf-1",
          source: "node-1",
          sourceHandle: "out-port-1",
          target: "node-2",
          targetHandle: "in-port-1",
        })
      ).rejects.toThrow("Edge already exists");
    });

    it("allows a second edge from the same source to a different target", async () => {
      const differentEdge = {
        _id: "edge-db-1",
        source: "node-1",
        sourceHandle: "out-port-1",
        target: "node-3", // different target
        targetHandle: "in-port-2",
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([differentEdge]),
            }),
          }),
          insert: vi.fn().mockResolvedValue("edge-db-2"),
        },
      } as unknown as MutationCtx;

      const result = await createEdgeHandler(mockCtx, {
        id: "edge-uuid-2",
        workflowId: "wf-1",
        source: "node-1",
        sourceHandle: "out-port-1",
        target: "node-2", // different target than existing
        targetHandle: "in-port-1",
      });

      expect(result).toBe("edge-db-2");
    });

    it("allows edges without handles (null sourceHandle / targetHandle)", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]),
            }),
          }),
          insert: vi.fn().mockResolvedValue("edge-db-3"),
        },
      } as unknown as MutationCtx;

      await createEdgeHandler(mockCtx, {
        id: "edge-uuid-3",
        workflowId: "wf-1",
        source: "node-1",
        sourceHandle: null,
        target: "node-2",
        targetHandle: null,
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "edges",
        expect.objectContaining({ sourceHandle: null, targetHandle: null })
      );
    });
  });

  // ─── deleteEdgeHandler ────────────────────────────────────────────────────

  describe("deleteEdgeHandler", () => {
    it("deletes an edge by its external id", async () => {
      const existing = { _id: "edge-db-1", id: "edge-uuid-1", workflowId: "wf-1" };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(existing),
            }),
          }),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      await deleteEdgeHandler(mockCtx, { id: "edge-uuid-1" });

      expect(mockCtx.db.delete).toHaveBeenCalledWith("edge-db-1");
      expect(mockCtx.db.delete).toHaveBeenCalledTimes(1);
    });

    it("throws when the edge is not found", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        deleteEdgeHandler(mockCtx, { id: "nonexistent-edge" })
      ).rejects.toThrow("Edge not found");
    });
  });
});
