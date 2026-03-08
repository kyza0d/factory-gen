import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  ActionCtx,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { UINodeSchema, IOParam, NodeMetadata } from "@registry/types";
import { ALL_NODES } from "./nodes";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StepStatus = "pending" | "generating" | "completed" | "failed";
export type GenerationStatus = "generating" | "completed" | "failed";

export type GenerationPlanStep = {
  title: string;
  description: string;
  nodeType: "AI" | "Input" | "Output" | "Trigger";
  suggestedLabel: string;
};

export type NodeWithStepIndex = {
  id: string;
  stepIndex: number;
  outputs: Array<{ id: string; name: string; type: string; description: string; defaultValue: unknown; options: string[] | null; enabled: boolean }>;
  inputs: Array<{ id: string; name: string; type: string; description: string; defaultValue: unknown; options: string[] | null; enabled: boolean }>;
};

export type GeneratedEdge = {
  id: string;
  workflowId: string;
  source: string;
  sourceHandle: string | null;
  target: string;
  targetHandle: string | null;
};

// ─── Pure logic ────────────────────────────────────────────────────────────────

/**
 * Computes the canvas position for a node at the given step index.
 * Layout: Input at (50, 150), subsequent nodes spaced 300px right.
 */
export function computeNodePosition(stepIndex: number): { x: number; y: number } {
  return { x: 50 + stepIndex * 300, y: 150 };
}

/**
 * Builds sequential edges connecting nodes in stepIndex order.
 * For [A(0), B(1), C(2)] produces [A→B, B→C].
 */
export function buildSequentialEdges(
  nodes: NodeWithStepIndex[],
  workflowId = ""
): GeneratedEdge[] {
  const sorted = [...nodes].sort((a, b) => a.stepIndex - b.stepIndex);
  const edges: GeneratedEdge[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const source = sorted[i];
    const target = sorted[i + 1];
    edges.push({
      id: crypto.randomUUID(),
      workflowId,
      source: source.id,
      sourceHandle: source.outputs[0]?.id ?? null,
      target: target.id,
      targetHandle: target.inputs[0]?.id ?? null,
    });
  }

  return edges;
}

/**
 * Builds the node specification string included in the LLM prompt for a given step.
 * Includes id, defaultValue, and options so the LLM can produce structurally correct params.
 */
export function buildNodeSpec(nodeTypeDef: NodeMetadata | undefined, fallbackType: string): string {
  if (!nodeTypeDef) return `Type: ${fallbackType}`;
  return `Type: ${nodeTypeDef.type}
Label: ${nodeTypeDef.label}
Inputs: ${JSON.stringify(nodeTypeDef.inputs?.map((i) => ({ id: i.id, name: i.name, type: i.type, defaultValue: i.defaultValue, options: i.options })))}
Outputs: ${JSON.stringify(nodeTypeDef.outputs?.map((o) => ({ id: o.id, name: o.name, type: o.type, defaultValue: o.defaultValue, options: o.options })))}
Parameters: ${JSON.stringify(nodeTypeDef.parameters?.map((p) => ({ id: p.id, name: p.name, type: p.type, defaultValue: p.defaultValue, options: p.options })))}
Modules: ${JSON.stringify(nodeTypeDef.modules?.map((m) => ({ type: m.type, label: m.label })))}`;
}

/**
 * Merges LLM-generated node params with the canonical registry definition.
 * Registry fields (id, options, type, description) are always authoritative.
 * LLM-generated defaultValues are preserved when present (e.g. context-specific system prompts).
 */
export function mergeNodeWithRegistry(
  llmOutput: { inputs: IOParam[]; outputs: IOParam[]; parameters: IOParam[] },
  nodeTypeDef: NodeMetadata | undefined
): { inputs: IOParam[]; outputs: IOParam[]; parameters: IOParam[] } {
  if (!nodeTypeDef) return llmOutput;

  const inputs: IOParam[] = nodeTypeDef.inputs?.map((regInput) => {
    const llmInput = llmOutput.inputs.find((i) => i.name === regInput.name);
    return { ...regInput, enabled: true, defaultValue: llmInput?.defaultValue ?? regInput.defaultValue ?? null };
  }) ?? llmOutput.inputs;

  const outputs: IOParam[] = nodeTypeDef.outputs?.map((regOutput) => {
    const llmOutput_ = llmOutput.outputs.find((o) => o.name === regOutput.name);
    return { ...regOutput, enabled: true, defaultValue: llmOutput_?.defaultValue ?? regOutput.defaultValue ?? null };
  }) ?? llmOutput.outputs;

  const parameters: IOParam[] = nodeTypeDef.parameters?.map((regParam) => {
    const llmParam = llmOutput.parameters.find((p) => p.name === regParam.name);
    return { ...regParam, enabled: true, defaultValue: llmParam?.defaultValue ?? regParam.defaultValue ?? null };
  }) ?? llmOutput.parameters;

  return { inputs, outputs, parameters };
}

/**
 * Sorts steps to enforce logical workflow order:
 * Input/Trigger (0) -> AI (1) -> Output (2)
 *
 * This corrects LLM outputs that might be out of order.
 */
export function sortPlanSteps(steps: GenerationPlanStep[]): GenerationPlanStep[] {
  const typeOrder: Record<string, number> = {
    "Trigger": 0,
    "Input": 0,
    "AI": 1,
    "Output": 2,
  };

  return [...steps].sort((a, b) => {
    const orderA = typeOrder[a.nodeType] ?? 1;
    const orderB = typeOrder[b.nodeType] ?? 1;
    return orderA - orderB;
  });
}

// ─── Mutation handlers (testable) ──────────────────────────────────────────────

export async function createWorkflowGenerationHandler(
  ctx: MutationCtx,
  args: { workflowId: string; prompt: string; totalSteps: number }
): Promise<string> {
  return await ctx.db.insert("workflowGenerations", {
    workflowId: args.workflowId,
    status: "generating",
    totalSteps: args.totalSteps,
    completedSteps: 0,
    prompt: args.prompt,
  });
}

export async function createGenerationStepsHandler(
  ctx: MutationCtx,
  args: { generationId: string; workflowId: string; steps: GenerationPlanStep[] }
): Promise<void> {
  for (let i = 0; i < args.steps.length; i++) {
    const step = args.steps[i];
    await ctx.db.insert("generationSteps", {
      generationId: args.generationId,
      workflowId: args.workflowId,
      stepIndex: i,
      title: step.title,
      description: step.description,
      nodeType: step.nodeType,
      suggestedLabel: step.suggestedLabel,
      status: "pending",
    });
  }
}

export async function updateStepStatusHandler(
  ctx: MutationCtx,
  args: { stepId: string; status: StepStatus; nodeId?: string; error?: string }
): Promise<void> {
  const step = await ctx.db
    .query("generationSteps")
    .filter((q) => q.eq(q.field("_id"), args.stepId))
    .first();

  if (!step) {
    throw new Error(`Step not found: ${args.stepId}`);
  }

  const patch: Record<string, unknown> = { status: args.status };
  if (args.nodeId !== undefined) patch.nodeId = args.nodeId;
  if (args.error !== undefined) patch.error = args.error;

  await ctx.db.patch(args.stepId as any, patch as any);
}

export async function updateGenerationStatusHandler(
  ctx: MutationCtx,
  args: { generationId: string; status: GenerationStatus; error?: string }
): Promise<void> {
  const generation = await ctx.db
    .query("workflowGenerations")
    .filter((q) => q.eq(q.field("_id"), args.generationId))
    .first();

  if (!generation) return;

  const patch: Record<string, unknown> = { status: args.status };
  if (args.error !== undefined) patch.error = args.error;

  await ctx.db.patch(args.generationId as any, patch as any);
}

export async function checkAndFinalizeGenerationHandler(
  ctx: MutationCtx,
  args: { generationId: string; workflowId: string }
): Promise<void> {
  const generation = await ctx.db
    .query("workflowGenerations")
    .filter((q) => q.eq(q.field("_id"), args.generationId))
    .first();

  if (!generation) return;

  const steps = await ctx.db
    .query("generationSteps")
    .withIndex("by_generationId", (q) => q.eq("generationId", args.generationId))
    .collect();

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === generation.totalSteps;

  await ctx.db.patch(args.generationId as any, {
    completedSteps: completedCount,
    ...(allDone ? { status: "completed" as const } : {}),
  });

  if (allDone) {
    await ctx.scheduler.runAfter(0, internal.workflow_generation.generateEdgesForWorkflow, {
      generationId: args.generationId,
      workflowId: args.workflowId,
    });
  }
}

export async function createGeneratedEdgesHandler(
  ctx: MutationCtx,
  args: { edges: GeneratedEdge[] }
): Promise<void> {
  for (const edge of args.edges) {
    await ctx.db.insert("edges", {
      id: edge.id,
      workflowId: edge.workflowId,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    });
  }
}

// ─── Internal mutations ────────────────────────────────────────────────────────

export const createWorkflowGeneration = internalMutation({
  args: {
    workflowId: v.string(),
    prompt: v.string(),
    totalSteps: v.number(),
  },
  handler: createWorkflowGenerationHandler,
});

export const createGenerationSteps = internalMutation({
  args: {
    generationId: v.string(),
    workflowId: v.string(),
    steps: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        nodeType: v.string(),
        suggestedLabel: v.string(),
      })
    ),
  },
  handler: createGenerationStepsHandler,
});

export const updateStepStatus = internalMutation({
  args: {
    stepId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    nodeId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: updateStepStatusHandler,
});

export const updateGenerationStatus = internalMutation({
  args: {
    generationId: v.string(),
    status: v.union(v.literal("generating"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: updateGenerationStatusHandler,
});

export const checkAndFinalizeGeneration = internalMutation({
  args: {
    generationId: v.string(),
    workflowId: v.string(),
  },
  handler: checkAndFinalizeGenerationHandler,
});

export const createGeneratedEdges = internalMutation({
  args: {
    edges: v.array(
      v.object({
        id: v.string(),
        workflowId: v.string(),
        source: v.string(),
        sourceHandle: v.union(v.string(), v.null()),
        target: v.string(),
        targetHandle: v.union(v.string(), v.null()),
      })
    ),
  },
  handler: createGeneratedEdgesHandler,
});

// ─── Internal queries ──────────────────────────────────────────────────────────

export const getGenerationStepsWithNodes = internalQuery({
  args: { generationId: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const steps = await ctx.db
      .query("generationSteps")
      .withIndex("by_generationId", (q) => q.eq("generationId", args.generationId))
      .collect();

    const nodesWithStepIndex: NodeWithStepIndex[] = [];
    for (const step of steps) {
      if (step.status === "completed" && step.nodeId) {
        const node = await ctx.db
          .query("nodes")
          .withIndex("by_workflowId_nodeId", (q) =>
            q.eq("workflowId", step.workflowId).eq("id", step.nodeId!)
          )
          .first();

        if (node) {
          nodesWithStepIndex.push({
            id: node.id,
            stepIndex: step.stepIndex,
            outputs: node.outputs as NodeWithStepIndex["outputs"],
            inputs: node.inputs as NodeWithStepIndex["inputs"],
          });
        }
      }
    }

    return nodesWithStepIndex;
  },
});

// ─── Schemas ───────────────────────────────────────────────────────────────────

const GenerationPlanSchema = z.object({
  steps: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      nodeType: z.enum(["Trigger", "Input", "AI", "Output"]),
      suggestedLabel: z.string(),
    })
  ),
});

// ─── Actions ───────────────────────────────────────────────────────────────────

/**
 * Phase 1: Generate a lightweight plan (step titles) and kick off per-node generation.
 * The frontend immediately sees the step list; nodes appear as they're generated.
 */
export const initiateWorkflowGeneration = action({
  args: {
    prompt: v.string(),
    workflowId: v.string(),
  },
  handler: async (ctx: ActionCtx, args): Promise<{ generationId: string }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

    const nodeTypeList = ALL_NODES.map((n) => `- ${n.type}: ${n.description}`).join("\n");

    // Phase 1: generate plan
    let plan: z.infer<typeof GenerationPlanSchema>;
    try {
      const { output } = await generateText({
        model: openai("gpt-4o-2024-08-06"),
        output: Output.object({ schema: GenerationPlanSchema }),
        prompt: `You are planning a visual workflow. Given the user's request, decide which nodes are needed.

User request: "${args.prompt}"

Available node types:
${nodeTypeList}

Return a steps array listing each node needed in order.
Rules:
- The first node MUST be an Input or Trigger node.
- The last node MUST be an Output node.
- AI nodes MUST be in between.

A typical workflow is:
1. Input node (user data entry)
2. One or more AI nodes (processing)
3. Output node (result display)

Keep titles short and action-oriented (e.g. "Collect user text", "Summarize with AI", "Show result").`,
      });
      plan = output;

      // Enforce logical order: Trigger/Input -> AI -> Output
      // This fixes the bug where LLMs sometimes return steps in reverse order (e.g. Output -> AI -> Input)
      plan.steps = sortPlanSteps(plan.steps);
    } catch (err) {
      throw new Error(`Failed to plan workflow: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Store plan in DB
    const generationId: string = await ctx.runMutation(
      internal.workflow_generation.createWorkflowGeneration,
      {
        workflowId: args.workflowId,
        prompt: args.prompt,
        totalSteps: plan.steps.length,
      }
    );

    await ctx.runMutation(internal.workflow_generation.createGenerationSteps, {
      generationId,
      workflowId: args.workflowId,
      steps: plan.steps,
    });

    // Phase 2: schedule step 0 only; each step chains to the next sequentially
    // This ensures nodes appear on canvas in logical order (Input → AI → Output)
    if (plan.steps.length > 0) {
      await ctx.scheduler.runAfter(0, internal.workflow_generation.generateNodeStep, {
        generationId,
        workflowId: args.workflowId,
        stepIndex: 0,
        prompt: args.prompt,
        step: plan.steps[0],
        allSteps: plan.steps,
      });
    }

    return { generationId };
  },
});

/**
 * Phase 2: Generate a single node for a planned step. Steps run sequentially —
 * each step schedules the next after completing to ensure ordered canvas appearance.
 */
export const generateNodeStep = internalAction({
  args: {
    generationId: v.string(),
    workflowId: v.string(),
    stepIndex: v.number(),
    prompt: v.string(),
    step: v.object({
      title: v.string(),
      description: v.string(),
      nodeType: v.string(),
      suggestedLabel: v.string(),
    }),
    allSteps: v.array(v.object({
      title: v.string(),
      description: v.string(),
      nodeType: v.string(),
      suggestedLabel: v.string(),
    })),
  },
  handler: async (ctx: ActionCtx, args): Promise<void> => {
    // Get the step's _id from DB
    const steps: Array<{ _id: string; stepIndex: number }> = await ctx.runQuery(
      internal.workflow_generation.getStepByIndex,
      { generationId: args.generationId, stepIndex: args.stepIndex }
    );

    if (!steps.length) return;
    const stepId = steps[0]._id;

    // Mark as generating
    await ctx.runMutation(internal.workflow_generation.updateStepStatus, {
      stepId,
      status: "generating",
    });

    const position = computeNodePosition(args.stepIndex);
    const nodeTypeDef = ALL_NODES.find((n) => n.type === args.step.nodeType);
    const nodeSpec = buildNodeSpec(nodeTypeDef, args.step.nodeType);

    try {
      const { output } = await generateText({
        model: openai("gpt-4o-2024-08-06"),
        output: Output.object({ schema: UINodeSchema }),
        prompt: `Generate a UINode configuration for this workflow step.

Overall workflow request: "${args.prompt}"
Step title: "${args.step.title}"
Step description: "${args.step.description}"
Suggested label: "${args.step.suggestedLabel}"

Node type specification:
${nodeSpec}

Requirements:
- Use a unique UUID for 'id'
- Set position to { x: ${position.x}, y: ${position.y} }
- Use nodeType '${args.step.nodeType}'
- Use label '${args.step.suggestedLabel}'
- All parameters and modules must have 'enabled: true'
- Use the EXACT 'id' and 'options' values from the type spec above for each input/output/parameter — do NOT invent new IDs
- For 'defaultValue': use the spec's default EXCEPT for AI node parameters where you should generate context-specific values based on the overall workflow request and step purpose (e.g. write a tailored systemPrompt that reflects what this AI step should do)`,
      });

      // Generate a guaranteed-unique ID server-side, ignoring the LLM's ID
      const nodeId = crypto.randomUUID();

      // Merge: registry fields (id, options, type) win; LLM's defaultValues are preserved
      const { inputs, outputs, parameters } = mergeNodeWithRegistry(output, nodeTypeDef);

      // Store node
      await ctx.runMutation(internal.workflow_generation.insertGeneratedNode, {
        node: { ...output, id: nodeId, workflowId: args.workflowId, position, inputs, outputs, parameters },
      });

      // Mark step complete
      await ctx.runMutation(internal.workflow_generation.updateStepStatus, {
        stepId,
        status: "completed",
        nodeId,
      });
    } catch (err) {
      await ctx.runMutation(internal.workflow_generation.updateStepStatus, {
        stepId,
        status: "failed",
        error: err instanceof Error ? err.message : "Node generation failed",
      });
    }

    // Chain to the next step sequentially (ensures ordered node appearance on canvas)
    const nextIndex = args.stepIndex + 1;
    if (nextIndex < args.allSteps.length) {
      await ctx.scheduler.runAfter(0, internal.workflow_generation.generateNodeStep, {
        generationId: args.generationId,
        workflowId: args.workflowId,
        stepIndex: nextIndex,
        prompt: args.prompt,
        step: args.allSteps[nextIndex],
        allSteps: args.allSteps,
      });
    }

    // Check if all steps are done → trigger edge generation
    await ctx.runMutation(internal.workflow_generation.checkAndFinalizeGeneration, {
      generationId: args.generationId,
      workflowId: args.workflowId,
    });
  },
});

/**
 * Phase 3: Connect all generated nodes with sequential edges.
 */
export const generateEdgesForWorkflow = internalAction({
  args: {
    generationId: v.string(),
    workflowId: v.string(),
  },
  handler: async (ctx: ActionCtx, args): Promise<void> => {
    const nodesWithStepIndex: NodeWithStepIndex[] = await ctx.runQuery(
      internal.workflow_generation.getGenerationStepsWithNodes,
      { generationId: args.generationId }
    );

    const edges = buildSequentialEdges(nodesWithStepIndex, args.workflowId);

    await ctx.runMutation(internal.workflow_generation.createGeneratedEdges, { edges });
  },
});

// ─── Helper internal query for step lookup ─────────────────────────────────────

export const getStepByIndex = internalQuery({
  args: {
    generationId: v.string(),
    stepIndex: v.number(),
  },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("generationSteps")
      .withIndex("by_generationId", (q) => q.eq("generationId", args.generationId))
      .filter((q) => q.eq(q.field("stepIndex"), args.stepIndex))
      .collect();
  },
});

// ─── Helper internal mutation to insert a generated node ─────────────────────

export const insertGeneratedNode = internalMutation({
  args: {
    node: v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      workflowId: v.string(),
      inputs: v.array(v.any()),
      outputs: v.array(v.any()),
      parameters: v.array(v.any()),
      modules: v.optional(v.union(v.array(v.object({
        id: v.string(),
        type: v.string(),
        label: v.string(),
        value: v.optional(v.union(v.string(), v.null())),
        enabled: v.boolean(),
      })), v.null())),
      position: v.object({ x: v.number(), y: v.number() }),
      uiComponent: v.optional(v.union(v.string(), v.null())),
      agentDefinitionId: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("nodes", {
      id: args.node.id,
      type: args.node.type,
      label: args.node.label,
      workflowId: args.node.workflowId,
      inputs: args.node.inputs,
      outputs: args.node.outputs,
      parameters: args.node.parameters,
      modules: args.node.modules,
      position: args.node.position,
      uiComponent: args.node.uiComponent,
    });
  },
});

// ─── Public queries (frontend subscriptions) ───────────────────────────────────

export const getWorkflowGeneration = query({
  args: { workflowId: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("workflowGenerations")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .first();
  },
});

export const getGenerationSteps = query({
  args: { workflowId: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("generationSteps")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .order("asc")
      .collect();
  },
});
