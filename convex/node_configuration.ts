import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { IOParam, NodeModule } from "@registry/types";

/**
 * Validates a parameter value against its schema.
 * Throws an error if validation fails.
 *
 * @param param - The parameter definition
 * @param value - The value to validate (can be null to clear)
 * @throws Error if validation fails
 */
export function validateParameterValue(param: IOParam, value: any): void {
  // Allow null only if value is explicitly null (clearing)
  if (value === null) {
    return;
  }

  // Type checking
  switch (param.type) {
    case "string":
      if (typeof value !== "string") {
        throw new Error(
          `Parameter '${param.name}' must be a string, got ${typeof value}`
        );
      }
      break;

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        throw new Error(
          `Parameter '${param.name}' must be a number, got ${typeof value}`
        );
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        throw new Error(
          `Parameter '${param.name}' must be a boolean, got ${typeof value}`
        );
      }
      break;

    case "json":
      try {
        if (typeof value === "string") {
          JSON.parse(value);
        } else if (typeof value !== "object") {
          throw new Error("Must be valid JSON");
        }
      } catch (e) {
        throw new Error(
          `Parameter '${param.name}' must be valid JSON: ${
            e instanceof Error ? e.message : "Unknown error"
          }`
        );
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        throw new Error(`Parameter '${param.name}' must be an array`);
      }
      break;
  }

  // Options validation
  if (param.options && param.options.length > 0) {
    if (!param.options.includes(String(value))) {
      throw new Error(
        `Parameter '${param.name}' must be one of: ${param.options.join(", ")}`
      );
    }
  }
}

/**
 * Retrieve a single parameter configuration by nodeId and paramId.
 */
export async function getNodeParameterConfigHandler(
  ctx: QueryCtx,
  args: { nodeId: string; paramId: string }
) {
  const config = await ctx.db
    .query("node_parameter_configs")
    .withIndex("by_nodeId_paramId", (q) =>
      q.eq("nodeId", args.nodeId).eq("paramId", args.paramId)
    )
    .first();

  return config || null;
}

export const getNodeParameterConfig = internalQuery({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
  },
  handler: getNodeParameterConfigHandler,
});

/**
 * Retrieve all parameter configurations for a node.
 */
export async function getNodeParameterConfigsHandler(
  ctx: QueryCtx,
  args: { nodeId: string }
) {
  return await ctx.db
    .query("node_parameter_configs")
    .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
    .collect();
}

export const getNodeParameterConfigs = internalQuery({
  args: {
    nodeId: v.string(),
  },
  handler: getNodeParameterConfigsHandler,
});

/**
 * Update or create a parameter configuration.
 * Validates the value before storing.
 */
export async function updateNodeParameterHandler(
  ctx: MutationCtx,
  args: { nodeId: string; paramId: string; value: any }
) {
  // 1. Validate node exists
  const node = await ctx.db
    .query("nodes")
    .filter((q) => q.eq(q.field("id"), args.nodeId))
    .first();

  if (!node) {
    throw new Error(`Node not found: ${args.nodeId}`);
  }

  // 2. Validate parameter exists in node definition
  const param = node.parameters?.find(
    (p: IOParam) => p.id === args.paramId
  );

  if (!param) {
    throw new Error(`Parameter not found: ${args.paramId}`);
  }

  // 3. Validate value type matches parameter type
  validateParameterValue(param, args.value);

  // 4. Check if configuration exists
  const existing = await ctx.db
    .query("node_parameter_configs")
    .withIndex("by_nodeId_paramId", (q) =>
      q.eq("nodeId", args.nodeId).eq("paramId", args.paramId)
    )
    .first();

  const now = Date.now();

  if (existing) {
    // Update existing
    await ctx.db.patch(existing._id, {
      configuredValue: args.value,
      updatedAt: now,
      validated: true,
    });

    return existing._id;
  } else {
    // Create new
    return await ctx.db.insert("node_parameter_configs", {
      nodeId: args.nodeId,
      paramId: args.paramId,
      configuredValue: args.value,
      createdAt: now,
      updatedAt: now,
      validated: true,
      validationErrors: [],
    });
  }
}

export const updateNodeParameter = internalMutation({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
    value: v.any(),
  },
  handler: updateNodeParameterHandler,
});

/**
 * Clear a parameter configuration (remove it from the database).
 */
export async function clearNodeParameterHandler(
  ctx: MutationCtx,
  args: { nodeId: string; paramId: string }
) {
  const existing = await ctx.db
    .query("node_parameter_configs")
    .withIndex("by_nodeId_paramId", (q) =>
      q.eq("nodeId", args.nodeId).eq("paramId", args.paramId)
    )
    .first();

  if (!existing) {
    return; // Already cleared
  }

  await ctx.db.delete(existing._id);
}

export const clearNodeParameter = internalMutation({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
  },
  handler: clearNodeParameterHandler,
});

/**
 * Retrieve all module configurations for a node.
 */
export async function getNodeModulesHandler(
  ctx: QueryCtx,
  args: { nodeId: string }
) {
  const node = await ctx.db
    .query("nodes")
    .filter((q) => q.eq(q.field("id"), args.nodeId))
    .first();

  if (!node) {
    throw new Error(`Node not found: ${args.nodeId}`);
  }

  // Return modules stored in the node itself
  return node.modules || [];
}

export const getNodeModules = internalQuery({
  args: {
    nodeId: v.string(),
  },
  handler: getNodeModulesHandler,
});

/**
 * Add a module to a node.
 */
export async function addNodeModuleHandler(
  ctx: MutationCtx,
  args: { nodeId: string; module: { id: string; type: string; label: string; value: string | null; enabled: boolean } }
) {
  const node = await ctx.db
    .query("nodes")
    .filter((q) => q.eq(q.field("id"), args.nodeId))
    .first();

  if (!node) {
    throw new Error(`Node not found: ${args.nodeId}`);
  }

  const currentModules = (node.modules || []) as NodeModule[];

  // Check for duplicate ID
  if (currentModules.some((m) => m.id === args.module.id)) {
    throw new Error(`Module with ID ${args.module.id} already exists`);
  }

  // Add new module
  const updatedModules = [...currentModules, args.module];

  await ctx.db.patch(node._id, {
    modules: updatedModules,
  });

  return args.module.id;
}

export const addNodeModule = internalMutation({
  args: {
    nodeId: v.string(),
    module: v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      value: v.union(v.string(), v.null()),
      enabled: v.boolean(),
    }),
  },
  handler: addNodeModuleHandler,
});

/**
 * Update a module value or enabled state in a node.
 */
export async function updateNodeModuleHandler(
  ctx: MutationCtx,
  args: { nodeId: string; moduleId: string; value?: string | null; enabled?: boolean }
) {
  const node = await ctx.db
    .query("nodes")
    .filter((q) => q.eq(q.field("id"), args.nodeId))
    .first();

  if (!node) {
    throw new Error(`Node not found: ${args.nodeId}`);
  }

  const currentModules = (node.modules || []) as NodeModule[];
  const moduleIndex = currentModules.findIndex(
    (m) => m.id === args.moduleId
  );

  if (moduleIndex === -1) {
    throw new Error(`Module not found: ${args.moduleId}`);
  }

  // Update the module
  currentModules[moduleIndex] = {
    ...currentModules[moduleIndex],
    ...(args.value !== undefined ? { value: args.value } : {}),
    ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
  };

  await ctx.db.patch(node._id, {
    modules: currentModules,
  });
}

export const updateNodeModule = internalMutation({
  args: {
    nodeId: v.string(),
    moduleId: v.string(),
    value: v.optional(v.union(v.string(), v.null())),
    enabled: v.optional(v.boolean()),
  },
  handler: updateNodeModuleHandler,
});

/**
 * Remove a module from a node.
 */
export async function removeNodeModuleHandler(
  ctx: MutationCtx,
  args: { nodeId: string; moduleId: string }
) {
  const node = await ctx.db
    .query("nodes")
    .filter((q) => q.eq(q.field("id"), args.nodeId))
    .first();

  if (!node) {
    throw new Error(`Node not found: ${args.nodeId}`);
  }

  const currentModules = (node.modules || []) as NodeModule[];
  const filtered = currentModules.filter((m) => m.id !== args.moduleId);

  if (filtered.length === currentModules.length) {
    throw new Error(`Module not found: ${args.moduleId}`);
  }

  await ctx.db.patch(node._id, {
    modules: filtered,
  });
}

export const removeNodeModule = internalMutation({
  args: {
    nodeId: v.string(),
    moduleId: v.string(),
  },
  handler: removeNodeModuleHandler,
});

/**
 * Validate all parameter configurations for a node.
 */
export const validateNodeConfiguration = internalQuery({
  args: {
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("nodes")
      .filter((q) => q.eq(q.field("id"), args.nodeId))
      .first();

    if (!node) {
      throw new Error(`Node not found: ${args.nodeId}`);
    }

    const configs = await ctx.db
      .query("node_parameter_configs")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
      .collect();

    const errors: Array<{
      paramId: string;
      paramName: string;
      error: string;
    }> = [];

    // Validate each configuration
    for (const config of configs) {
      const param = node.parameters?.find(
        (p: IOParam) => p.id === config.paramId
      );

      if (!param) {
        errors.push({
          paramId: config.paramId,
          paramName: "unknown",
          error: "Parameter no longer exists",
        });
        continue;
      }

      try {
        validateParameterValue(param, config.configuredValue);
      } catch (error) {
        errors.push({
          paramId: config.paramId,
          paramName: param.name,
          error: error instanceof Error ? error.message : "Validation failed",
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      configCount: configs.length,
    };
  },
});

// ============================================================================
// PUBLIC MUTATIONS (for frontend use)
// ============================================================================

/**
 * Update a parameter definition (e.g., toggle enabled state) in a node.
 */
export async function updateNodeParameterDefinitionHandler(
  ctx: MutationCtx,
  args: { nodeId: string; paramId: string; enabled: boolean }
) {
  const node = await ctx.db
    .query("nodes")
    .filter((q) => q.eq(q.field("id"), args.nodeId))
    .first();

  if (!node) {
    throw new Error(`Node not found: ${args.nodeId}`);
  }

  const currentParams = (node.parameters || []) as IOParam[];
  const paramIndex = currentParams.findIndex((p) => p.id === args.paramId);

  if (paramIndex === -1) {
    throw new Error(`Parameter not found: ${args.paramId}`);
  }

  // Update the parameter definition
  currentParams[paramIndex] = {
    ...currentParams[paramIndex],
    enabled: args.enabled,
  };

  await ctx.db.patch(node._id, {
    parameters: currentParams,
  });
}

export const updateNodeParameterDefinition = internalMutation({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
    enabled: v.boolean(),
  },
  handler: updateNodeParameterDefinitionHandler,
});

/**
 * Public mutation wrapper for parameter updates
 */
export const updateNodeParameterPublic = mutation({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    return await updateNodeParameterHandler(ctx, args);
  },
});

/**
 * Public mutation wrapper for parameter definition updates
 */
export const updateNodeParameterDefinitionPublic = mutation({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await updateNodeParameterDefinitionHandler(ctx, args);
  },
});

/**
 * Public mutation wrapper for clearing parameter configurations
 */
export const clearNodeParameterPublic = mutation({
  args: {
    nodeId: v.string(),
    paramId: v.string(),
  },
  handler: async (ctx, args) => {
    return await clearNodeParameterHandler(ctx, args);
  },
});

/**
 * Public mutation wrapper for adding modules
 */
export const addNodeModulePublic = mutation({
  args: {
    nodeId: v.string(),
    module: v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      value: v.union(v.string(), v.null()),
      enabled: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    return await addNodeModuleHandler(ctx, args);
  },
});

/**
 * Public mutation wrapper for updating modules
 */
export const updateNodeModulePublic = mutation({
  args: {
    nodeId: v.string(),
    moduleId: v.string(),
    value: v.optional(v.union(v.string(), v.null())),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await updateNodeModuleHandler(ctx, args);
  },
});

/**
 * Public mutation wrapper for removing modules
 */
export const removeNodeModulePublic = mutation({
  args: {
    nodeId: v.string(),
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    return await removeNodeModuleHandler(ctx, args);
  },
});
