import { describe, it, expect, vi } from "vitest";
import {
  renameWorkflowHandler,
  deleteWorkflowHandler,
} from "../../nodes";
import { MutationCtx } from "../../_generated/server";

describe("Workflow Management", () => {
  // ─── renameWorkflowHandler ────────────────────────────────────────────────

  describe("renameWorkflowHandler", () => {
    it("patches the workflow with the new name", async () => {
      const existing = {
        _id: "wf-db-1",
        id: "wf-uuid-1",
        name: "Old Name",
      };
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(existing),
            }),
          }),
          patch: vi.fn(),
        },
      } as unknown as MutationCtx;

      await renameWorkflowHandler(mockCtx, { id: "wf-uuid-1", name: "New Name" });

      expect(mockCtx.db.patch).toHaveBeenCalledWith("wf-db-1", { name: "New Name" });
    });

    it("throws when the workflow is not found", async () => {
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
        renameWorkflowHandler(mockCtx, { id: "nonexistent", name: "Foo" })
      ).rejects.toThrow("Workflow not found");
    });
  });

  // ─── deleteWorkflowHandler ────────────────────────────────────────────────

  describe("deleteWorkflowHandler", () => {
    it("throws when the workflow is not found", async () => {
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
        deleteWorkflowHandler(mockCtx, { id: "nonexistent" })
      ).rejects.toThrow("Workflow not found");
    });

    it("cascades deletion: removes nodes, edges, then workflow record", async () => {
      const workflow = {
        _id: "wf-db-1",
        id: "wf-1",
      };
      const nodes = [
        { _id: "node-db-1", id: "n1", workflowId: "wf-1" },
        { _id: "node-db-2", id: "n2", workflowId: "wf-1" },
      ];
      const edges = [
        { _id: "edge-db-1", id: "e1", workflowId: "wf-1" },
      ];

      const mockCtx = {
        db: {
          query: vi.fn().mockImplementation((table: string) => {
            if (table === "workflows") {
              return {
                filter: vi.fn().mockReturnValue({
                  first: vi.fn().mockResolvedValue(workflow),
                }),
              };
            }
            if (table === "nodes") {
              return {
                withIndex: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue(nodes),
                }),
              };
            }
            if (table === "edges") {
              return {
                withIndex: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue(edges),
                }),
              };
            }
            return {};
          }),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      await deleteWorkflowHandler(mockCtx, { id: "wf-1" });

      // Nodes deleted first
      expect(mockCtx.db.delete).toHaveBeenCalledWith("node-db-1");
      expect(mockCtx.db.delete).toHaveBeenCalledWith("node-db-2");
      // Then edges
      expect(mockCtx.db.delete).toHaveBeenCalledWith("edge-db-1");
      // Finally workflow record
      expect(mockCtx.db.delete).toHaveBeenCalledWith("wf-db-1");
      // Total 4 deletes: 2 nodes + 1 edge + 1 workflow
      expect(mockCtx.db.delete).toHaveBeenCalledTimes(4);
    });

    it("deletes an empty workflow (no nodes/edges) without error", async () => {
      const workflow = {
        _id: "wf-db-1",
        id: "wf-1",
      };
      const mockCtx = {
        db: {
          query: vi.fn().mockImplementation((table: string) => {
            if (table === "workflows") {
              return {
                filter: vi.fn().mockReturnValue({
                  first: vi.fn().mockResolvedValue(workflow),
                }),
              };
            }
            // nodes and edges empty
            return {
              withIndex: vi.fn().mockReturnValue({
                collect: vi.fn().mockResolvedValue([]),
              }),
            };
          }),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      await deleteWorkflowHandler(mockCtx, { id: "wf-1" });

      expect(mockCtx.db.delete).toHaveBeenCalledWith("wf-db-1");
      expect(mockCtx.db.delete).toHaveBeenCalledTimes(1);
    });
  });
});
