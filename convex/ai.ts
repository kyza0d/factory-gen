import { action, internalMutation, internalQuery, ActionCtx, QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { UINodeSchema, WorkflowGraphSchema, UINode, WorkflowGraph, IOParam, NodeExecutionStatus } from "./schema/nodes"; // eslint-disable-line @typescript-eslint/no-unused-vars

// Define a type for execution events
export type ExecutionEvent = {
  nodeId: string;
  status: "started" | "completed" | "failed";
  executionStatus: NodeExecutionStatus;
  output?: unknown;
};

/**
 * Generates a UI node configuration based on a user prompt.
 */
export const generateNodeHandler = async (_ctx: ActionCtx, args: { prompt: string; workflowId?: string }): Promise<UINode> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Convex environment variables.");
  }

  try {
    const { output } = await generateText({
      model: openai("gpt-4o-2024-08-06"),
      output: Output.object({ schema: UINodeSchema }),
      prompt: `Generate a Zod-safe JSON configuration for a UI node in a visual workflow editor.
      The user prompt is: "${args.prompt}"
      
      Ensure the node has:
      - A unique UUID for 'id'.
      - A relevant 'type'.
      - A descriptive 'label'.
      - A default value for all new nodes unless otherwise specified.
      - Appropriate 'inputs', 'outputs', 'parameters', and 'modules' (if the node contains internal components like text inputs).
      - For a 'User Input Capture' node, ensure it includes a 'text' module with a suitable label.
      - A 'uiComponent' name that matches the node type (PascalCase).`,
    });

    return output;
  } catch (error) {
    console.error("Error generating UI node:", error);
    throw new Error("Failed to generate UI node configuration.");
  }
};

export const generateNode = action({
  args: {
    prompt: v.string(),
    workflowId: v.optional(v.string()),
  },
  handler: generateNodeHandler,
});

/**
 * Generates a complete workflow graph based on a user description.
 */
export const generateWorkflowHandler = async (_ctx: ActionCtx, args: { prompt: string }): Promise<WorkflowGraph> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Convex environment variables.");
  }

  try {
    // Replaced deprecated generateObject with generateText + Output.object
    const { output } = await generateText({
      model: openai("gpt-4o-2024-08-06"),
      output: Output.object({ schema: WorkflowGraphSchema }),
      prompt: `Generate a complete visual workflow graph based on the user's description: "${args.prompt}"

      The workflow should typically follow this structure:
      1. User Input: A node where the user provides the initial data (e.g., text).
      2. AI Module: One or more AI processing nodes that transform the input.
      3. Preview Output: A node that displays the final result.

      Available Node Types and Requirements:
      - 'Input': Label it "User Input". It should have an output named "input" (type: string) and a 'text' module.
      - 'AI': A general-purpose AI node. It should have:
        - Input: "source" (type: string)
        - Output: "result" (type: string)
        - Parameter: "systemPrompt" (type: string, description: "Instructions for the AI")
        - Parameter: "model" (type: string, options: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"])
      - 'Output': Label it "Preview Output". It should have an input named "content" (type: string) and a 'text' module for displaying the result.

      Layout nodes logically:
      - Assign 'position' coordinates {x, y} for each node.
      - Start 'Input' at {x: 50, y: 150}.
      - Space nodes horizontally by ~300 pixels (e.g., 350, 650, etc.).
      - Space nodes vertically if there are branches.

      Ensure each node has a unique UUID.`,
    });

    return output;
  } catch (error) {
    console.error("Error generating workflow:", error);
    throw new Error("Failed to generate workflow configuration.");
  }
};

export const generateWorkflow = action({
  args: {
    prompt: v.string(),
  },
  handler: generateWorkflowHandler,
});


/**
 * Internal query to fetch nodes and edges for a workflow execution.
 * This bridges the gap, allowing the Action to read from the DB safely.
 */
export const getWorkflowData = internalQuery({
  args: { workflowId: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    const edges = await ctx.db
      .query("edges")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    return { nodes, edges };
  }
});


// Define a type for execution result
export type WorkflowExecutionResult = {
  events: ExecutionEvent[];
  finalOutput: unknown;
};

/**
 * Executes a complete workflow graph.
 */
export const executeWorkflowHandler = async (
  ctx: ActionCtx,
  args: { workflowId: string }
): Promise<WorkflowExecutionResult> => {
  console.log(`Executing workflow with ID: ${args.workflowId}`);

  const { nodes, edges } = await ctx.runQuery(internal.ai.getWorkflowData, {
    workflowId: args.workflowId
  });

  // Build the graph: adjacency list and in-degrees for topological sort
  const graph: Map<string, string[]> = new Map();
  const inDegree: Map<string, number> = new Map();

  const nodeMap: Map<string, UINode> = new Map(
    (nodes as UINode[]).map((node) => [node.id, node])
  );

  for (const node of nodes) {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const sourceNodeId = edge.source;
    const targetNodeId = edge.target;

    if (graph.has(sourceNodeId) && graph.has(targetNodeId)) {
      graph.get(sourceNodeId)?.push(targetNodeId);
      inDegree.set(targetNodeId, (inDegree.get(targetNodeId) || 0) + 1);
    }
  }

  // Topological Sort (Kahn's algorithm)
  const queue: string[] = [];
  for (const nodeId of inDegree.keys()) {
    if (inDegree.get(nodeId) === 0) {
      queue.push(nodeId);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    topologicalOrder.push(nodeId);

    for (const neighborId of graph.get(nodeId) || []) {
      inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
      if (inDegree.get(neighborId) === 0) {
        queue.push(neighborId);
      }
    }
  }

  if (topologicalOrder.length !== nodes.length) {
    throw new Error("Workflow contains a cycle!");
  }

  const nodeOutputs: Map<string, unknown> = new Map(); // Stores outputs of executed nodes
  const executionEvents: ExecutionEvent[] = [];

  for (const nodeId of topologicalOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) {
      continue; // Should not happen if graph is built correctly
    }

    executionEvents.push({ nodeId: node.id, status: "started", executionStatus: "pending" });

    let output: unknown;
    try {
      // Determine inputs for the current node from previous node outputs
      const inputs: Record<string, unknown> = {};
      for (const edge of edges) {
        if (edge.target === nodeId) {
          // Find the source output to get its handle name or use the handle ID
          const sourceOutputValue = nodeOutputs.get(edge.source);

          if (sourceOutputValue !== undefined) {
            // If the targetHandle is provided, we map it.
            // In our AI generation, targetHandle usually refers to the input ID or name.
            const targetInput = node.inputs.find((i: IOParam) => i.id === edge.targetHandle || i.name === edge.targetHandle);
            const inputKey = targetInput ? targetInput.name : (edge.targetHandle || "default");
            inputs[inputKey] = sourceOutputValue;
          }
        }
      }

      switch (node.type) {
        case "Input":
          // Use module value for Input if available, otherwise fallback to parameter
          const textModule = node.modules?.find((m) => m.type === "text");
          output = textModule?.value || node.parameters?.find((p: IOParam) => p.name === "value")?.defaultValue || "Default User Input";
          break;
        case "AI":
          const systemPrompt = node.parameters?.find((p: IOParam) => p.name === "systemPrompt")?.defaultValue || "You are a helpful AI.";
          const modelName = node.parameters?.find((p: IOParam) => p.name === "model")?.defaultValue || "gpt-4o";

          // AI expects 'source' input based on WorkflowGraphSchema in generateWorkflowHandler
          const aiInput = inputs["source"] || inputs["default"] || "No input provided for AI";

          console.log(`AI ${node.label} processing with prompt: "${systemPrompt}", input: "${aiInput}", model: "${modelName}"`);

          try {
            const { text } = await generateText({
              model: openai(modelName as string || "gpt-4o"),
              system: systemPrompt as string,
              prompt: aiInput as string,
            });
            output = text;
          } catch (error) {
            console.error(`Error in AI ${node.id}:`, error);
            executionEvents.push({ nodeId: node.id, status: "failed", executionStatus: "danger", output: `Error: ${error instanceof Error ? error.message : "AI generation failed"}` });
            throw error;
          }
          break;
        case "Output":
          // Output expects 'content' input
          output = inputs["content"] || inputs["default"] || null;
          break;
        default:
          console.warn(`Unknown node type: ${node.type}. Skipping execution for node ${node.id}`);
          output = null;
      }
      nodeOutputs.set(nodeId, output);
      executionEvents.push({ nodeId: node.id, status: "completed", executionStatus: "success", output: output });
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      // Ensure a failure event is recorded if not already done in AI catch
      if (!executionEvents.some(e => e.nodeId === node.id && e.status === "failed")) {
        executionEvents.push({ nodeId: node.id, status: "failed", executionStatus: "danger", output: error instanceof Error ? error.message : "Execution failed" });
      }
      throw error;
    }
  }

  // Find the Output node or the last node in the topological order
  const previewOutputNode = (nodes as UINode[]).find((node: UINode) => node.type === "Output") as UINode | undefined;
  let finalOutput: unknown;

  if (previewOutputNode && nodeOutputs.has(previewOutputNode.id)) {
    finalOutput = nodeOutputs.get(previewOutputNode.id);
  } else if (topologicalOrder.length > 0) {
    finalOutput = nodeOutputs.get(topologicalOrder[topologicalOrder.length - 1]);
  } else {
    finalOutput = "Workflow executed with no nodes.";
  }

  return { events: executionEvents, finalOutput: finalOutput };
};

export const executeWorkflow = action({
  args: {
    workflowId: v.string(),
  },
  handler: executeWorkflowHandler,
});
