import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { InputNode } from "./node_types/Input";
import { AINode } from "./node_types/AI";
import { OutputNode } from "./node_types/Output";
import { TriggerNode } from "./node_types/Trigger";
import { NodeDefinition } from "./node_types/types";

export * from "./node_types/types";

export const ALL_NODES: NodeDefinition[] = [
  TriggerNode,
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
    modules: v.optional(v.union(v.array(v.object({ 
      id: v.string(), 
      type: v.string(), 
      label: v.string(), 
      value: v.optional(v.union(v.string(), v.null())),
      enabled: v.boolean(),
    })), v.null())),
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

    const meta = NodeRegistry[args.type];
    
    // Merge modules with registry defaults
    const finalModules = meta?.modules?.map(m => {
      const existing = args.modules?.find(am => am.type === m.type && am.label === m.label);
      return {
        id: existing?.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
        type: m.type,
        label: m.label,
        value: existing?.value ?? m.value ?? null,
        enabled: existing?.enabled ?? m.enabled ?? true
      };
    }) ?? args.modules ?? null;

    // Merge parameters with registry defaults
    const finalParameters = (meta?.parameters ?? args.parameters ?? []).map(p => {
      const existing = args.parameters?.find(ap => ap.id === p.id);
      return {
        ...p,
        enabled: existing?.enabled ?? true,
        defaultValue: existing?.defaultValue ?? p.defaultValue
      };
    });

    const nodeId = await ctx.db.insert("nodes", {
      ...args,
      modules: finalModules as any,
      parameters: finalParameters,
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
 * Retrieves a single workflow by its external ID.
 */
export const getWorkflow = query({
  args: { workflowId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .filter((q) => q.eq(q.field("id"), args.workflowId))
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
 * Retrieves all workflows with their status.
 */
export const getWorkflowsWithStatus = query({
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
    workspaceId?: string;
  }
}) => {
  const { workflow } = args;

  // Cleanup: Delete existing workflow data for the same ID
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

  // Insert the workflow itself
  await ctx.db.insert("workflows", {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    fileId: workflow.fileId as any,
    workspaceId: workflow.workspaceId,
  });

  // Insert all nodes
  for (const node of workflow.nodes) {
    const meta = NodeRegistry[node.type];
    
    // Merge modules with registry defaults
    const finalModules = meta?.modules?.map(m => {
      const existing = node.modules?.find((am: any) => am.type === m.type && am.label === m.label);
      return {
        id: existing?.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
        type: m.type,
        label: m.label,
        value: existing?.value ?? m.value ?? null,
        enabled: existing?.enabled ?? m.enabled ?? true
      };
    }) ?? node.modules ?? null;

    // Merge parameters with registry defaults
    const finalParameters = (meta?.parameters ?? node.parameters ?? []).map((p: any) => {
      const existing = node.parameters?.find((ap: any) => ap.id === p.id);
      return {
        ...p,
        enabled: existing?.enabled ?? true,
        defaultValue: existing?.defaultValue ?? p.defaultValue
      };
    });

    await ctx.db.insert("nodes", {
      ...node,
      modules: finalModules,
      parameters: finalParameters,
      workflowId: workflow.id,
    });
  }

  // Insert all edges
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
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = crypto.randomUUID();
    await ctx.db.insert("workflows", {
      id,
      name: args.name,
      fileId: args.fileId,
      workspaceId: args.workspaceId,
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
      fileId: v.optional(v.string()),
      workspaceId: v.optional(v.string()),
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
      modules: v.optional(v.array(v.object({ 
        id: v.string(), 
        type: v.string(), 
        label: v.string(), 
        value: v.optional(v.any()),
        enabled: v.boolean(),
      }))),
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

/**
 * Handler for creating a single edge between two nodes.
 * Extracted for testing.
 */
export const createEdgeHandler = async (
  ctx: MutationCtx,
  args: {
    id: string;
    workflowId: string;
    source: string;
    sourceHandle: string | null;
    target: string;
    targetHandle: string | null;
  }
) => {
  const existing = await ctx.db
    .query("edges")
    .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
    .collect();

  const duplicate = existing.find(
    (e) =>
      e.source === args.source &&
      e.sourceHandle === args.sourceHandle &&
      e.target === args.target &&
      e.targetHandle === args.targetHandle
  );

  if (duplicate) {
    throw new Error("Edge already exists");
  }

  return await ctx.db.insert("edges", {
    id: args.id,
    workflowId: args.workflowId,
    source: args.source,
    sourceHandle: args.sourceHandle,
    target: args.target,
    targetHandle: args.targetHandle,
  });
};

export const createEdge = mutation({
  args: {
    id: v.string(),
    workflowId: v.string(),
    source: v.string(),
    sourceHandle: v.optional(v.union(v.string(), v.null())),
    target: v.string(),
    targetHandle: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) =>
    createEdgeHandler(ctx, {
      ...args,
      sourceHandle: args.sourceHandle ?? null,
      targetHandle: args.targetHandle ?? null,
    }),
});

/**
 * Handler for deleting a single edge by its external UUID.
 * Extracted for testing.
 */
export const deleteEdgeHandler = async (
  ctx: MutationCtx,
  args: { id: string }
) => {
  const found = await ctx.db
    .query("edges")
    .filter((q) => q.eq(q.field("id"), args.id))
    .first();

  if (!found) {
    throw new Error("Edge not found");
  }

  await ctx.db.delete(found._id);
};

export const deleteEdge = mutation({
  args: { id: v.string() },
  handler: deleteEdgeHandler,
});

/**
 * Handler for renaming a workflow.
 * Extracted for testing.
 */
export const renameWorkflowHandler = async (
  ctx: MutationCtx,
  args: { id: string; name: string }
) => {
  const workflow = await ctx.db
    .query("workflows")
    .filter((q) => q.eq(q.field("id"), args.id))
    .first();

  if (!workflow) throw new Error("Workflow not found");

  await ctx.db.patch(workflow._id, { name: args.name });
};

export const renameWorkflow = mutation({
  args: { id: v.string(), name: v.string() },
  handler: renameWorkflowHandler,
});

/**
 * Handler for deleting a workflow with cascade delete.
 * Cascade order: nodes → edges → workflow record.
 * Extracted for testing.
 */
export const deleteWorkflowHandler = async (
  ctx: MutationCtx,
  args: { id: string }
) => {
  const workflow = await ctx.db
    .query("workflows")
    .filter((q) => q.eq(q.field("id"), args.id))
    .first();

  if (!workflow) throw new Error("Workflow not found");

  const nodes = await ctx.db
    .query("nodes")
    .withIndex("by_workflowId", (q) => q.eq("workflowId", args.id))
    .collect();
  for (const node of nodes) await ctx.db.delete(node._id);

  const edges = await ctx.db
    .query("edges")
    .withIndex("by_workflowId", (q) => q.eq("workflowId", args.id))
    .collect();
  for (const edge of edges) await ctx.db.delete(edge._id);

  await ctx.db.delete(workflow._id);
};

export const deleteWorkflow = mutation({
  args: { id: v.string() },
  handler: deleteWorkflowHandler,
});
