import { z } from "zod";

/**
 * Basic data types for inputs/outputs/parameters.
 */
export const ValueTypeSchema = z.enum(["string", "number", "boolean", "json", "array"]);

/**
 * Schema for an individual input, output, or parameter of a node.
 */
export const IOParamSchema = z.object({
  id: z.string().describe("Unique identifier for the I/O or parameter (UUID)."),
  name: z.string().min(1).describe("Human-readable name."),
  type: ValueTypeSchema.describe("Expected data type."),
  description: z.string().describe("Brief explanation of the I/O or parameter."),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).nullable().describe("Optional default value for parameters (as string, number, boolean, or null)."),
  options: z.array(z.string()).nullable().describe("Optional list of choices for dropdowns/enums (or null)."),
  enabled: z.boolean().optional().describe("Whether the parameter is currently enabled for this node instance."),
});

export const NodeExecutionStatusSchema = z.enum(["idle", "pending", "success", "warning", "danger"]);

export const NodeModuleSchema = z.object({
  id: z.string().describe("Unique identifier for the module (UUID)."),
  type: z.string().describe("Type of the module (e.g., 'text', 'image')."),
  label: z.string().describe("Display label for the module."),
  value: z.string().nullable().describe("Actual content or value of the module (as string or null)."),
  enabled: z.boolean().describe("Whether the module is currently enabled for this node instance."),
});

/**
 * Schema for a UI Node structure.
 */
export const UINodeSchema = z.object({
  id: z.string().describe("Unique identifier for the UI node (UUID)."),
  type: z.string().min(1).describe("Type of the node (e.g., 'TextSummarizer', 'ImageGenerator')."),
  label: z.string().min(1).describe("Display label for the node."),
  inputs: z.array(IOParamSchema).describe("List of inputs the node accepts (can be empty)."),
  outputs: z.array(IOParamSchema).describe("List of outputs the node produces (can be empty)."),
  parameters: z.array(IOParamSchema).describe("Configurable parameters for the node (can be empty)."),
  agentDefinitionId: z.string().nullable().describe("Reference to an agent definition (or null)."),
  uiComponent: z.string().nullable().describe("Name of a specific React component to render."),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).describe("Coordinates for positioning the node on the canvas."),
  modules: z.array(NodeModuleSchema).nullable().describe("List of modules within the node (can be empty)."),
});

/**
 * Metadata about a node definition.
 */
export const NodeMetadataSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional().describe("Icon identifier key referencing NODE_TYPE_ICONS in the registry."),
  inputs: z.array(IOParamSchema).optional(),
  outputs: z.array(IOParamSchema).optional(),
  parameters: z.array(IOParamSchema).optional(),
  modules: z.array(z.object({
    type: z.string(),
    label: z.string(),
    value: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
  })).optional(),
  uiComponent: z.string().optional(),
});

/**
 * Schema for a complete workflow graph consisting of nodes and edges.
 */
export const WorkflowGraphSchema = z.object({
  id: z.string().describe("Unique identifier for the workflow (UUID)."),
  name: z.string().min(1).describe("Name of the workflow."),
  description: z.string().describe("Description of the workflow."),
  nodes: z.array(UINodeSchema).describe("Array of UI nodes in the workflow."),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string().describe("ID of the source node."),
    sourceHandle: z.string().nullable().describe("Specific output handle of the source node."),
    target: z.string().describe("ID of the target node."),
    targetHandle: z.string().nullable().describe("Specific input handle of the target node."),
  })).describe("Array of connections between nodes."),
});

export type ValueType = z.infer<typeof ValueTypeSchema>;
export type IOParam = z.infer<typeof IOParamSchema>;
export type NodeModule = z.infer<typeof NodeModuleSchema>;
export type UINode = z.infer<typeof UINodeSchema>;
export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;
export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;
export type NodeExecutionStatus = z.infer<typeof NodeExecutionStatusSchema>;
