import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// ─── Handlers (extracted for unit testing) ────────────────────────────────────

export const createTriggerHandler = async (
  ctx: MutationCtx,
  args: {
    workflowId: string;
    nodeId: string;
    type: "webhook" | "cron" | "fileChange" | "httpRequest";
    config: Record<string, any>;
  }
) => {
  const now = Date.now();
  const triggerData: any = {
    workflowId: args.workflowId,
    nodeId: args.nodeId,
    type: args.type,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    triggerCount: 0,
  };

  if (args.type === "webhook") {
    triggerData.webhookId = args.config.webhookId ?? crypto.randomUUID();
    if (args.config.webhookSecret !== undefined) {
      triggerData.webhookSecret = args.config.webhookSecret;
    }
  } else if (args.type === "cron") {
    triggerData.cronExpression = args.config.cronExpression;
    triggerData.timezone = args.config.timezone ?? "UTC";
  } else if (args.type === "fileChange") {
    triggerData.watchPath = args.config.watchPath;
    triggerData.filePattern = args.config.filePattern ?? "*";
    triggerData.changeType = args.config.changeType ?? "all";
  } else if (args.type === "httpRequest") {
    triggerData.httpMethod = args.config.method ?? "POST";
  }

  return await ctx.db.insert("triggers", triggerData);
};

export const updateTriggerHandler = async (
  ctx: MutationCtx,
  args: {
    triggerId: string;
    config: Record<string, any>;
  }
) => {
  const trigger = await ctx.db
    .query("triggers")
    .filter((q) => q.eq(q.field("_id"), args.triggerId))
    .first();

  if (!trigger) throw new Error("Trigger not found");

  const updates: Record<string, any> = { updatedAt: Date.now() };

  const fields = [
    "type", "cronExpression", "timezone", "watchPath", "filePattern",
    "changeType", "webhookSecret", "enabled", "httpMethod",
  ];
  for (const field of fields) {
    if (args.config[field] !== undefined) {
      updates[field] = args.config[field];
    }
  }

  await ctx.db.patch(trigger._id, updates);
};

export const getTriggerHandler = async (
  ctx: QueryCtx,
  args: { triggerId: string }
) => {
  return await ctx.db
    .query("triggers")
    .filter((q) => q.eq(q.field("_id"), args.triggerId))
    .first();
};

export const getTriggersByWorkflowHandler = async (
  ctx: QueryCtx,
  args: { workflowId: string }
) => {
  return await ctx.db
    .query("triggers")
    .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
    .collect();
};

export const activateTriggerHandler = async (
  ctx: MutationCtx,
  args: {
    triggerId: string;
    payload: any;
  }
) => {
  const trigger = await ctx.db
    .query("triggers")
    .filter((q) => q.eq(q.field("_id"), args.triggerId))
    .first();

  if (!trigger) throw new Error("Trigger not found");
  if (!trigger.enabled) throw new Error("Trigger is disabled");

  const now = Date.now();
  const timestamp = new Date(now).toISOString();

  const executionId = await ctx.db.insert("triggerExecutions", {
    triggerId: args.triggerId,
    workflowId: trigger.workflowId,
    payload: args.payload,
    timestamp,
    executionStartTime: now,
    executionStatus: "pending",
    createdAt: now,
  });

  await ctx.db.patch(trigger._id, {
    lastTriggeredAt: now,
    triggerCount: trigger.triggerCount + 1,
    updatedAt: now,
  });

  return executionId;
};

export const deleteTriggerHandler = async (
  ctx: MutationCtx,
  args: { triggerId: string }
) => {
  const trigger = await ctx.db
    .query("triggers")
    .filter((q) => q.eq(q.field("_id"), args.triggerId))
    .first();

  if (!trigger) throw new Error("Trigger not found");

  const executions = await ctx.db
    .query("triggerExecutions")
    .withIndex("by_triggerId", (q) => q.eq("triggerId", args.triggerId))
    .collect();

  for (const exec of executions) {
    await ctx.db.delete(exec._id);
  }

  await ctx.db.delete(trigger._id);
};

// ─── Convex Mutations & Queries ───────────────────────────────────────────────

export const createTrigger = mutation({
  args: {
    workflowId: v.string(),
    nodeId: v.string(),
    type: v.union(
      v.literal("webhook"),
      v.literal("cron"),
      v.literal("fileChange"),
      v.literal("httpRequest")
    ),
    config: v.any(),
  },
  handler: createTriggerHandler,
});

export const updateTrigger = mutation({
  args: {
    triggerId: v.string(),
    config: v.any(),
  },
  handler: updateTriggerHandler,
});

export const getTrigger = query({
  args: { triggerId: v.string() },
  handler: getTriggerHandler,
});

export const getTriggersByWorkflow = query({
  args: { workflowId: v.string() },
  handler: getTriggersByWorkflowHandler,
});

export const activateTrigger = mutation({
  args: {
    triggerId: v.string(),
    payload: v.any(),
  },
  handler: activateTriggerHandler,
});

export const deleteTrigger = mutation({
  args: { triggerId: v.string() },
  handler: deleteTriggerHandler,
});

export const getExecutionsByTrigger = query({
  args: { triggerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("triggerExecutions")
      .withIndex("by_triggerId", (q) => q.eq("triggerId", args.triggerId))
      .collect();
  },
});

export const getTriggerByWebhookId = query({
  args: { webhookId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("triggers")
      .withIndex("by_webhookId", (q) => q.eq("webhookId", args.webhookId))
      .first();
  },
});
