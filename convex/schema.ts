import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    id: v.string(), // External UUID
    name: v.string(),
    isDefault: v.boolean(),
    description: v.optional(v.string()),
  }),

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
    modules: v.optional(v.union(v.array(v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      value: v.optional(v.union(v.string(), v.null())),
      enabled: v.boolean(),
    })), v.null())),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_workflowId_nodeId", ["workflowId", "id"]),

  workflows: defineTable({
    id: v.string(), // External UUID
    name: v.string(),
    description: v.optional(v.string()),
    fileId: v.optional(v.id("files")),
    workspaceId: v.optional(v.string()), // ID of the workspace it belongs to
    status: v.optional(v.union(v.literal("running"), v.literal("completed"), v.literal("failed"), v.literal("idle"))),
    isGlobal: v.optional(v.boolean()),
  })
    .index("by_fileId", ["fileId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_isGlobal", ["isGlobal"]),

  files: defineTable({
    name: v.string(),
    type: v.string(), // e.g., "workflow"
    description: v.optional(v.string()),
  }),

  edges: defineTable({
    id: v.string(), // External UUID
    workflowId: v.string(),
    source: v.string(),
    sourceHandle: v.optional(v.union(v.string(), v.null())),
    target: v.string(),
    targetHandle: v.optional(v.union(v.string(), v.null())),
  }).index("by_workflowId", ["workflowId"]),

  triggers: defineTable({
    workflowId: v.string(),
    nodeId: v.string(),
    type: v.union(
      v.literal("webhook"),
      v.literal("cron"),
      v.literal("fileChange"),
      v.literal("httpRequest")
    ),
    // Webhook fields
    webhookId: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    // Cron fields
    cronExpression: v.optional(v.string()),
    timezone: v.optional(v.string()),
    nextExecutionTime: v.optional(v.number()),
    // File watch fields
    watchPath: v.optional(v.string()),
    filePattern: v.optional(v.string()),
    changeType: v.optional(v.string()),
    // HTTP fields
    httpMethod: v.optional(v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("PUT"),
      v.literal("PATCH"),
      v.literal("DELETE"),
    )),
    httpAuthSecret: v.optional(v.string()),
    // Common
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastTriggeredAt: v.optional(v.number()),
    triggerCount: v.number(),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_webhookId", ["webhookId"]),

  triggerExecutions: defineTable({
    triggerId: v.string(),
    workflowId: v.string(),
    payload: v.any(),
    timestamp: v.string(),
    executionStartTime: v.number(),
    executionStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_triggerId", ["triggerId"])
    .index("by_workflowId", ["workflowId"]),

  workflowGenerations: defineTable({
    workflowId: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    totalSteps: v.number(),
    completedSteps: v.number(),
    prompt: v.string(),
    error: v.optional(v.string()),
  }).index("by_workflowId", ["workflowId"]),

  generationSteps: defineTable({
    generationId: v.string(),
    workflowId: v.string(),
    stepIndex: v.number(),
    title: v.string(),
    description: v.string(),
    nodeType: v.string(),
    suggestedLabel: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    nodeId: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_generationId", ["generationId"])
    .index("by_workflowId", ["workflowId"]),

  node_parameter_configs: defineTable({
    nodeId: v.string(),
    paramId: v.string(),
    configuredValue: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
    validated: v.boolean(),
    validationErrors: v.array(v.string()),
  })
    .index("by_nodeId", ["nodeId"])
    .index("by_nodeId_paramId", ["nodeId", "paramId"]),
});
