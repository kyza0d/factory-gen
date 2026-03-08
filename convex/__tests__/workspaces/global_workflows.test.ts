import { describe, it, expect, vi } from "vitest";
import { getWorkflowsByWorkspaceHandler } from "../../workspaces";
import { toggleGlobalWorkflowHandler } from "../../nodes";
import { MutationCtx, QueryCtx } from "../../_generated/server";

describe("Global Workflows", () => {
  describe("getWorkflowsByWorkspaceHandler", () => {
    it("returns both workspace-specific and global workflows", async () => {
      const workspaceId = "ws-123";
      const workspaceWorkflows = [
        { _id: "wf-1", id: "wf-1-uuid", name: "Workspace Workflow", workspaceId },
      ];
      const globalWorkflows = [
        { _id: "wf-2", id: "wf-2-uuid", name: "Global Workflow", isGlobal: true },
      ];

      const mockCtx = {
        db: {
          query: vi.fn().mockImplementation((table: string) => {
            if (table === "workflows") {
              return {
                withIndex: vi.fn().mockImplementation((indexName: string, queryFn: any) => {
                  if (indexName === "by_workspaceId") {
                    return {
                      collect: vi.fn().mockResolvedValue(workspaceWorkflows),
                    };
                  }
                  if (indexName === "by_isGlobal") {
                    return {
                      collect: vi.fn().mockResolvedValue(globalWorkflows),
                    };
                  }
                  return { collect: vi.fn().mockResolvedValue([]) };
                }),
                filter: vi.fn().mockReturnValue({
                  first: vi.fn().mockResolvedValue({ id: workspaceId, name: "Test WS", isDefault: false }),
                }),
              };
            }
            if (table === "workspaces") {
                return {
                    filter: vi.fn().mockReturnValue({
                        first: vi.fn().mockResolvedValue({ id: workspaceId, name: "Test WS", isDefault: false }),
                    }),
                };
            }
            return {};
          }),
        },
      } as unknown as QueryCtx;

      const result = await getWorkflowsByWorkspaceHandler(mockCtx, { workspaceId });

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "Workspace Workflow" }),
        expect.objectContaining({ name: "Global Workflow" }),
      ]));
    });

    it("de-duplicates workflows if they are both in the workspace and global", async () => {
      const workspaceId = "ws-123";
      const workflow = { _id: "wf-1", id: "wf-1-uuid", name: "Both", workspaceId, isGlobal: true };
      
      const mockCtx = {
        db: {
          query: vi.fn().mockImplementation((table: string) => {
            if (table === "workflows") {
              return {
                withIndex: vi.fn().mockImplementation((indexName: string) => {
                  if (indexName === "by_workspaceId") {
                    return { collect: vi.fn().mockResolvedValue([workflow]) };
                  }
                  if (indexName === "by_isGlobal") {
                    return { collect: vi.fn().mockResolvedValue([workflow]) };
                  }
                  return { collect: vi.fn().mockResolvedValue([]) };
                }),
              };
            }
            if (table === "workspaces") {
                return {
                    filter: vi.fn().mockReturnValue({
                        first: vi.fn().mockResolvedValue({ id: workspaceId, isDefault: false }),
                    }),
                };
            }
            return {};
          }),
        },
      } as unknown as QueryCtx;

      const result = await getWorkflowsByWorkspaceHandler(mockCtx, { workspaceId });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("wf-1-uuid");
    });
  });

  describe("toggleGlobalWorkflowHandler", () => {
    it("patches the workflow with the new isGlobal status", async () => {
      const workflowId = "wf-uuid-1";
      const existing = {
        _id: "wf-db-1",
        id: workflowId,
        name: "Test Workflow",
        isGlobal: false,
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

      await toggleGlobalWorkflowHandler(mockCtx, { id: workflowId, isGlobal: true });

      expect(mockCtx.db.patch).toHaveBeenCalledWith("wf-db-1", { isGlobal: true });
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
        toggleGlobalWorkflowHandler(mockCtx, { id: "nonexistent", isGlobal: true })
      ).rejects.toThrow("Workflow not found");
    });
  });
});
