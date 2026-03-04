import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  nodes: defineTable({
    id: v.string(), // External UUID
    type: v.string(),
    label: v.string(),
    inputs: v.array(v.any()),
    outputs: v.array(v.any()),
    parameters: v.array(v.any()),
    agentDefinitionId: v.optional(v.union(v.string(), v.null())),
    uiComponent: v.optional(v.union(v.string(), v.null())),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    workflowId: v.optional(v.string()), // ID of the workflow it belongs to
    modules: v.optional(v.union(v.array(v.object({ id: v.string(), type: v.string(), label: v.string(), value: v.optional(v.union(v.string(), v.null())) })), v.null())),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_workflowId_nodeId", ["workflowId", "id"]),

  workflows: defineTable({
    id: v.string(), // External UUID
    name: v.string(),
    description: v.optional(v.string()),
    fileId: v.optional(v.id("files")), // New field to associate with a file
  }).index("by_fileId", ["fileId"]),

  files: defineTable({
    name: v.string(),
    type: v.string(), // e.g., "workflow"
    description: v.optional(v.string()),
  }),

  edges: defineTable({
    id: v.string(), // External UUID
    workflowId: v.string(),
    source: v.string(),
    sourceHandle: v.optional(v.string()),
    target: v.string(),
    targetHandle: v.optional(v.string()),
  }).index("by_workflowId", ["workflowId"]),
});
