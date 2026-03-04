import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Handler for creating a new file.
 * Extracted for testing.
 */
export const createFileHandler = async (ctx: MutationCtx, args: { name: string; type: string; description?: string }) => {
  return await ctx.db.insert("files", {
    name: args.name,
    type: args.type,
    description: args.description,
  });
};

export const createFile = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
  },
  handler: createFileHandler,
});

/**
 * Handler for getting all files.
 * Extracted for testing.
 */
export const getFilesHandler = async (ctx: QueryCtx, _args: {}) => {
  return await ctx.db.query("files").collect();
};

export const getFiles = query({
  args: {},
  handler: getFilesHandler,
});

/**
 * Retrieves a single file by its ID.
 */
export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Deletes a file and its associated workflows.
 */
export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    // 1. Delete associated workflows
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.id))
      .collect();

    for (const wf of workflows) {
      // Cleanup nodes and edges for each workflow
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

    // 2. Delete the file itself
    await ctx.db.delete(args.id);
  },
});
