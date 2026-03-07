import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// ─── createWorkspace ──────────────────────────────────────────────────────────

export const createWorkspaceHandler = async (
  ctx: MutationCtx,
  args: { name: string; description?: string; isDefault?: boolean }
) => {
  const id = crypto.randomUUID();
  await ctx.db.insert("workspaces", {
    id,
    name: args.name,
    description: args.description,
    isDefault: args.isDefault ?? false,
  });
  return id;
};

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: createWorkspaceHandler,
});

// ─── getWorkspaces ────────────────────────────────────────────────────────────

export const getWorkspacesHandler = async (ctx: QueryCtx, _args: {}) => {
  return await ctx.db.query("workspaces").collect();
};

export const getWorkspaces = query({
  args: {},
  handler: getWorkspacesHandler,
});

// ─── ensureDefaultWorkspace ───────────────────────────────────────────────────

export const ensureDefaultWorkspaceHandler = async (
  ctx: MutationCtx,
  _args: {}
) => {
  const existing = await ctx.db
    .query("workspaces")
    .filter((q) => q.eq(q.field("isDefault"), true))
    .first();

  if (existing) return existing;

  const id = crypto.randomUUID();
  await ctx.db.insert("workspaces", {
    id,
    name: "Default",
    isDefault: true,
  });
};

export const ensureDefaultWorkspace = mutation({
  args: {},
  handler: ensureDefaultWorkspaceHandler,
});

// ─── renameWorkspace ──────────────────────────────────────────────────────────

export const renameWorkspaceHandler = async (
  ctx: MutationCtx,
  args: { id: string; name: string }
) => {
  const workspace = await ctx.db
    .query("workspaces")
    .filter((q) => q.eq(q.field("id"), args.id))
    .first();

  if (!workspace) throw new Error("Workspace not found");

  await ctx.db.patch(workspace._id, { name: args.name });
};

export const renameWorkspace = mutation({
  args: { id: v.string(), name: v.string() },
  handler: renameWorkspaceHandler,
});

// ─── deleteWorkspace ──────────────────────────────────────────────────────────

export const deleteWorkspaceHandler = async (
  ctx: MutationCtx,
  args: { id: string }
) => {
  const workspace = await ctx.db
    .query("workspaces")
    .filter((q) => q.eq(q.field("id"), args.id))
    .first();

  if (!workspace) throw new Error("Workspace not found");
  if (workspace.isDefault) throw new Error("Cannot delete the default workspace");

  const workflows = await ctx.db
    .query("workflows")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.id))
    .collect();

  for (const wf of workflows) {
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", wf.id))
      .collect();
    for (const node of nodes) await ctx.db.delete(node._id);

    const edges = await ctx.db
      .query("edges")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", wf.id))
      .collect();
    for (const edge of edges) await ctx.db.delete(edge._id);

    await ctx.db.delete(wf._id);
  }

  await ctx.db.delete(workspace._id);
};

export const deleteWorkspace = mutation({
  args: { id: v.string() },
  handler: deleteWorkspaceHandler,
});

// ─── getWorkflowsByWorkspace ──────────────────────────────────────────────────

export const getWorkflowsByWorkspaceHandler = async (
  ctx: QueryCtx,
  args: { workspaceId: string }
) => {
  // Get workflows with the specified workspaceId
  const workflowsWithWorkspace = await ctx.db
    .query("workflows")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
    .collect();

  // Check if this is the default workspace
  const workspace = await ctx.db
    .query("workspaces")
    .filter((q) => q.eq(q.field("id"), args.workspaceId))
    .first();

  if (workspace?.isDefault) {
    // For the default workspace, also include workflows without a workspaceId (backward compatibility)
    const allWorkflows = await ctx.db.query("workflows").collect();
    const workflowsWithoutWorkspace = allWorkflows.filter(
      (w) => !w.workspaceId
    );
    return [...workflowsWithWorkspace, ...workflowsWithoutWorkspace];
  }

  return workflowsWithWorkspace;
};

export const getWorkflowsByWorkspace = query({
  args: { workspaceId: v.string() },
  handler: getWorkflowsByWorkspaceHandler,
});
