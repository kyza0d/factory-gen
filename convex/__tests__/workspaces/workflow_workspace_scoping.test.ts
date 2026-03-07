import { describe, it, expect, vi } from "vitest";
import { getWorkflowsByWorkspaceHandler } from "../../workspaces";
import { createWorkflowHandler } from "../../nodes";
import { MutationCtx, QueryCtx } from "../../_generated/server";

describe("Workflow–Workspace Scoping", () => {
  // ─── getWorkflowsByWorkspaceHandler ───────────────────────────────────────

  describe("getWorkflowsByWorkspaceHandler", () => {
    it("returns only workflows belonging to the specified workspace", async () => {
      const ws1Workflows = [
        { _id: "wf-db-1", id: "wf-1", name: "Flow A", workspaceId: "ws-1" },
        { _id: "wf-db-2", id: "wf-2", name: "Flow B", workspaceId: "ws-1" },
      ];
      const workspace = { _id: "ws-db-1", id: "ws-1", name: "Workspace 1", isDefault: false };

      const mockCtx = {
        db: {
          query: vi.fn((table) => {
            if (table === "workflows") {
              return {
                withIndex: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue(ws1Workflows),
                }),
              };
            }
            return {
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(workspace),
              }),
            };
          }),
        },
      } as unknown as QueryCtx;

      const result = await getWorkflowsByWorkspaceHandler(mockCtx, { workspaceId: "ws-1" });

      expect(mockCtx.db.query).toHaveBeenCalledWith("workflows");
      expect(result).toEqual(ws1Workflows);
      expect(result.every((wf) => wf.workspaceId === "ws-1")).toBe(true);
    });

    it("returns an empty array when the workspace has no workflows", async () => {
      const workspace = { _id: "ws-db-empty", id: "ws-empty", name: "Empty Workspace", isDefault: false };

      const mockCtx = {
        db: {
          query: vi.fn((table) => {
            if (table === "workflows") {
              return {
                withIndex: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue([]),
                }),
              };
            }
            return {
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(workspace),
              }),
            };
          }),
        },
      } as unknown as QueryCtx;

      const result = await getWorkflowsByWorkspaceHandler(mockCtx, { workspaceId: "ws-empty" });

      expect(result).toEqual([]);
    });

    it("uses the by_workspaceId index for the query", async () => {
      const workspace = { _id: "ws-db-1", id: "ws-1", name: "Workspace 1", isDefault: false };
      const withIndexMock = vi.fn().mockReturnValue({
        collect: vi.fn().mockResolvedValue([]),
      });

      const mockCtx = {
        db: {
          query: vi.fn((table) => {
            if (table === "workflows") {
              return { withIndex: withIndexMock };
            }
            return {
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(workspace),
              }),
            };
          }),
        },
      } as unknown as QueryCtx;

      await getWorkflowsByWorkspaceHandler(mockCtx, { workspaceId: "ws-1" });

      expect(withIndexMock).toHaveBeenCalledWith("by_workspaceId", expect.any(Function));
    });
  });

  // ─── createWorkflowHandler with workspaceId ───────────────────────────────

  describe("createWorkflowHandler – workspaceId support", () => {
    it("stores workspaceId on the workflow record when provided", async () => {
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

      await createWorkflowHandler(mockCtx, {
        workflow: {
          id: "wf-1",
          name: "Workspace Flow",
          nodes: [],
          edges: [],
          workspaceId: "ws-uuid-1",
        } as any,
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workflows",
        expect.objectContaining({
          id: "wf-1",
          name: "Workspace Flow",
          workspaceId: "ws-uuid-1",
        })
      );
    });

    it("can create a workflow without a workspaceId (backwards-compatible)", async () => {
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

      await createWorkflowHandler(mockCtx, {
        workflow: { id: "wf-legacy", name: "Legacy Flow", nodes: [], edges: [] },
      });

      // Should insert without workspaceId (or with undefined)
      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workflows",
        expect.objectContaining({ id: "wf-legacy" })
      );
    });

    it("scopes workflows to their respective workspaces independently", async () => {
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
          insert: vi.fn(),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      await createWorkflowHandler(mockCtx, {
        workflow: {
          id: "wf-1",
          name: "WS1 Flow",
          nodes: [],
          edges: [],
          workspaceId: "ws-1",
        } as any,
      });
      await createWorkflowHandler(mockCtx, {
        workflow: {
          id: "wf-2",
          name: "WS2 Flow",
          nodes: [],
          edges: [],
          workspaceId: "ws-2",
        } as any,
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workflows",
        expect.objectContaining({ id: "wf-1", workspaceId: "ws-1" })
      );
      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workflows",
        expect.objectContaining({ id: "wf-2", workspaceId: "ws-2" })
      );
    });
  });
});
