import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { InputNode } from "./node_types/Input";
import { AINode } from "./node_types/AI";
import { OutputNode } from "./node_types/Output";
import { NodeDefinition } from "./node_types/types";

export * from "./node_types/types";

export const ALL_NODES: NodeDefinition[] = [
  InputNode,
  AINode,
  OutputNode,
];

export const NodeRegistry: Record<string, NodeDefinition> = ALL_NODES.reduce(
  (acc, node) => ({ ...acc, [node.type]: node }),
  {}
);

/**
 * Stores a new UI node in the database.
 */
export const createNode = mutation({
  args: {
    id: v.string(), // UUID from external source or AI generator
    type: v.string(),
    label: v.string(),
    inputs: v.array(v.any()),
    outputs: v.array(v.any()),
    parameters: v.array(v.any()),
    agentDefinitionId: v.optional(v.union(v.string(), v.null())),
    uiComponent: v.optional(v.union(v.string(), v.null())),
    position: v.optional(v.object({ x: v.number(), y: v.number() })),
    workflowId: v.optional(v.string()),
    modules: v.optional(v.union(v.array(v.object({ id: v.string(), type: v.string(), label: v.string(), value: v.optional(v.union(v.string(), v.null())) })), v.null())),
  },
  handler: async (ctx, args) => {
    if (args.workflowId) {
      const existing = await ctx.db
        .query("nodes")
        .withIndex("by_workflowId_nodeId", (q) =>
          q.eq("workflowId", args.workflowId!).eq("id", args.id)
        )
        .first();
      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }

    const nodeId = await ctx.db.insert("nodes", {
      ...args,
    });
    return nodeId;
  },
});

/**
 * Retrieves a node by its database ID or external ID.
 */
export const getNode = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nodes")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();
  },
});

/**
 * Retrieves all workflows.
 */
export const getWorkflows = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workflows").collect();
  },
});

/**
 * Retrieves all nodes belonging to a specific workflow.
 */
export const getNodesByWorkflow = query({
  args: { workflowId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nodes")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .collect();
  },
});

/**
 * Retrieves all edges belonging to a specific workflow.
 */
export const getEdgesByWorkflow = query({
  args: { workflowId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("edges")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .collect();
  },
});

/**
 * Handler for creating a complete workflow.
 * Extracted for testing.
 */
export const createWorkflowHandler = async (ctx: MutationCtx, args: {
  workflow: {
    id: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    fileId?: string;
  }
}) => {
  const { workflow } = args;

  // 1. Cleanup: Delete existing workflow data for the same ID
  const existingWorkflow = await ctx.db
    .query("workflows")
    .filter((q) => q.eq(q.field("id"), workflow.id))
    .first();
  if (existingWorkflow) {
    await ctx.db.delete(existingWorkflow._id);
  }

  const existingNodes = await ctx.db
    .query("nodes")
    .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow.id))
    .collect();
  for (const node of existingNodes) {
    await ctx.db.delete(node._id);
  }

  const existingEdges = await ctx.db
    .query("edges")
    .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow.id))
    .collect();
  for (const edge of existingEdges) {
    await ctx.db.delete(edge._id);
  }

  // 2. Insert the workflow itself
  await ctx.db.insert("workflows", {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    fileId: workflow.fileId as any,
  });

  // 3. Insert all nodes
  for (const node of workflow.nodes) {
    await ctx.db.insert("nodes", {
      ...node,
      workflowId: workflow.id,
    });
  }

  // 4. Insert all edges
  for (const edge of workflow.edges) {
    await ctx.db.insert("edges", {
      ...edge,
      workflowId: workflow.id,
    });
  }

  return workflow.id;
};

/**
 * Creates a new empty workflow.
 */
export const createEmptyWorkflow = mutation({
  args: {
    name: v.string(),
    fileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const id = crypto.randomUUID();
    await ctx.db.insert("workflows", {
      id,
      name: args.name,
      fileId: args.fileId,
    });
    return id;
  },
});

/**
 * Stores a complete workflow (nodes and edges) in the database.
 */
export const createWorkflow = mutation({
  args: {
    workflow: v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      nodes: v.array(v.any()),
      edges: v.array(v.any()),
      fileId: v.optional(v.string()), // Optional fileId association
    }),
  },
  handler: createWorkflowHandler,
});

/**
 * Updates an existing node's configuration or position.
 */
export const updateNode = mutation({
  args: {
    id: v.string(), // External UUID
    updates: v.object({
      label: v.optional(v.string()),
      inputs: v.optional(v.array(v.any())),
      outputs: v.optional(v.array(v.any())),
      parameters: v.optional(v.array(v.any())),
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      modules: v.optional(v.array(v.object({ id: v.string(), type: v.string(), label: v.string(), value: v.optional(v.any()) }))),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nodes")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();
    if (!existing) {
      throw new Error("Node not found");
    }
    await ctx.db.patch(existing._id, args.updates);
  },
});

/**
 * Deletes a node.
 */
export const deleteNode = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nodes")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();
    if (!existing) {
      throw new Error("Node not found");
    }
    await ctx.db.delete(existing._id);
  },
});
