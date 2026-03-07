import { describe, it, expect, vi } from "vitest";
import {
  createWorkspaceHandler,
  getWorkspacesHandler,
  ensureDefaultWorkspaceHandler,
  renameWorkspaceHandler,
  deleteWorkspaceHandler,
} from "../../workspaces";
import { MutationCtx, QueryCtx } from "../../_generated/server";

describe("Workspace Management", () => {
  // ─── createWorkspaceHandler ────────────────────────────────────────────────

  describe("createWorkspaceHandler", () => {
    it("creates a workspace with the given name and returns its external id", async () => {
      const mockCtx = {
        db: {
          insert: vi.fn().mockResolvedValue("ws-db-id"),
        },
      } as unknown as MutationCtx;

      const result = await createWorkspaceHandler(mockCtx, { name: "Project Alpha" });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workspaces",
        expect.objectContaining({ name: "Project Alpha" })
      );
      expect(result).toBeDefined();
    });

    it("creates a non-default workspace by default", async () => {
      const mockCtx = {
        db: {
          insert: vi.fn().mockResolvedValue("ws-db-id"),
        },
      } as unknown as MutationCtx;

      await createWorkspaceHandler(mockCtx, { name: "Project Alpha" });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workspaces",
        expect.objectContaining({ isDefault: false })
      );
    });

    it("can create a workspace marked as default when isDefault is true", async () => {
      const mockCtx = {
        db: {
          insert: vi.fn().mockResolvedValue("ws-db-id"),
        },
      } as unknown as MutationCtx;

      await createWorkspaceHandler(mockCtx, { name: "Default", isDefault: true });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workspaces",
        expect.objectContaining({ name: "Default", isDefault: true })
      );
    });

    it("stores an optional description", async () => {
      const mockCtx = {
        db: {
          insert: vi.fn().mockResolvedValue("ws-db-id"),
        },
      } as unknown as MutationCtx;

      await createWorkspaceHandler(mockCtx, {
        name: "Described WS",
        description: "A workspace with a description",
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workspaces",
        expect.objectContaining({ description: "A workspace with a description" })
      );
    });
  });

  // ─── getWorkspacesHandler ──────────────────────────────────────────────────

  describe("getWorkspacesHandler", () => {
    it("returns all workspaces", async () => {
      const mockWorkspaces = [
        { _id: "ws-1", id: "ws-uuid-1", name: "Default", isDefault: true },
        { _id: "ws-2", id: "ws-uuid-2", name: "Project Alpha", isDefault: false },
      ];
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue(mockWorkspaces),
          }),
        },
      } as unknown as QueryCtx;

      const result = await getWorkspacesHandler(mockCtx, {});

      expect(mockCtx.db.query).toHaveBeenCalledWith("workspaces");
      expect(result).toEqual(mockWorkspaces);
    });

    it("returns an empty array when no workspaces exist", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([]),
          }),
        },
      } as unknown as QueryCtx;

      const result = await getWorkspacesHandler(mockCtx, {});

      expect(result).toEqual([]);
    });
  });

  // ─── ensureDefaultWorkspaceHandler ────────────────────────────────────────

  describe("ensureDefaultWorkspaceHandler", () => {
    it("returns the existing default workspace when one already exists", async () => {
      const existingDefault = {
        _id: "ws-db-1",
        id: "ws-uuid-1",
        name: "Default",
        isDefault: true,
      };
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(existingDefault),
            }),
          }),
          insert: vi.fn(),
        },
      } as unknown as MutationCtx;

      const result = await ensureDefaultWorkspaceHandler(mockCtx, {});

      expect(mockCtx.db.insert).not.toHaveBeenCalled();
      expect(result).toEqual(existingDefault);
    });

    it("creates and returns a default workspace when none exists", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
          insert: vi.fn().mockResolvedValue("ws-new-db-id"),
        },
      } as unknown as MutationCtx;

      await ensureDefaultWorkspaceHandler(mockCtx, {});

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "workspaces",
        expect.objectContaining({ name: "Default", isDefault: true })
      );
    });
  });

  // ─── renameWorkspaceHandler ────────────────────────────────────────────────

  describe("renameWorkspaceHandler", () => {
    it("patches the workspace with the new name", async () => {
      const existing = {
        _id: "ws-db-1",
        id: "ws-uuid-1",
        name: "Old Name",
        isDefault: false,
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

      await renameWorkspaceHandler(mockCtx, { id: "ws-uuid-1", name: "New Name" });

      expect(mockCtx.db.patch).toHaveBeenCalledWith("ws-db-1", { name: "New Name" });
    });

    it("throws when the workspace is not found", async () => {
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
        renameWorkspaceHandler(mockCtx, { id: "nonexistent", name: "Foo" })
      ).rejects.toThrow("Workspace not found");
    });
  });

  // ─── deleteWorkspaceHandler ────────────────────────────────────────────────

  describe("deleteWorkspaceHandler", () => {
    it("throws when the workspace is not found", async () => {
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
        deleteWorkspaceHandler(mockCtx, { id: "nonexistent" })
      ).rejects.toThrow("Workspace not found");
    });

    it("throws when attempting to delete the default workspace", async () => {
      const defaultWorkspace = {
        _id: "ws-db-1",
        id: "ws-uuid-1",
        name: "Default",
        isDefault: true,
      };
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(defaultWorkspace),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        deleteWorkspaceHandler(mockCtx, { id: "ws-uuid-1" })
      ).rejects.toThrow("Cannot delete the default workspace");
    });

    it("cascades deletion: removes all workflows, nodes, and edges in the workspace", async () => {
      const workspace = {
        _id: "ws-db-1",
        id: "ws-uuid-1",
        name: "To Delete",
        isDefault: false,
      };
      const workflows = [
        { _id: "wf-db-1", id: "wf-1", workspaceId: "ws-uuid-1" },
        { _id: "wf-db-2", id: "wf-2", workspaceId: "ws-uuid-1" },
      ];
      const nodesForWf1 = [{ _id: "node-db-1", id: "n1", workflowId: "wf-1" }];
      const edgesForWf1 = [{ _id: "edge-db-1", id: "e1", workflowId: "wf-1" }];
      const nodesForWf2: typeof nodesForWf1 = [];
      const edgesForWf2: typeof edgesForWf1 = [];

      const mockCtx = {
        db: {
          query: vi.fn().mockImplementation((table: string) => {
            if (table === "workspaces") {
              return {
                filter: vi.fn().mockReturnValue({
                  first: vi.fn().mockResolvedValue(workspace),
                }),
              };
            }
            if (table === "workflows") {
              return {
                withIndex: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue(workflows),
                }),
              };
            }
            if (table === "nodes") {
              return {
                withIndex: vi.fn().mockImplementation((_idx: string, fn: Function) => ({
                  collect: vi.fn().mockImplementation(() => {
                    // Return nodes only for wf-1
                    return Promise.resolve(nodesForWf1.concat(nodesForWf2));
                  }),
                })),
              };
            }
            if (table === "edges") {
              return {
                withIndex: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue(edgesForWf1.concat(edgesForWf2)),
                }),
              };
            }
            return {};
          }),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      await deleteWorkspaceHandler(mockCtx, { id: "ws-uuid-1" });

      // Nodes and edges deleted first
      expect(mockCtx.db.delete).toHaveBeenCalledWith("node-db-1");
      expect(mockCtx.db.delete).toHaveBeenCalledWith("edge-db-1");
      // Then workflows
      expect(mockCtx.db.delete).toHaveBeenCalledWith("wf-db-1");
      expect(mockCtx.db.delete).toHaveBeenCalledWith("wf-db-2");
      // Finally the workspace itself
      expect(mockCtx.db.delete).toHaveBeenCalledWith("ws-db-1");
    });

    it("deletes an empty workspace (no workflows) without error", async () => {
      const workspace = {
        _id: "ws-db-1",
        id: "ws-uuid-1",
        name: "Empty WS",
        isDefault: false,
      };
      const mockCtx = {
        db: {
          query: vi.fn().mockImplementation((table: string) => {
            if (table === "workspaces") {
              return {
                filter: vi.fn().mockReturnValue({
                  first: vi.fn().mockResolvedValue(workspace),
                }),
              };
            }
            // workflows, nodes, edges all empty
            return {
              withIndex: vi.fn().mockReturnValue({
                collect: vi.fn().mockResolvedValue([]),
              }),
            };
          }),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      await deleteWorkspaceHandler(mockCtx, { id: "ws-uuid-1" });

      expect(mockCtx.db.delete).toHaveBeenCalledWith("ws-db-1");
      expect(mockCtx.db.delete).toHaveBeenCalledTimes(1);
    });
  });
});
