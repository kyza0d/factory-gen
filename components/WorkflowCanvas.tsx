"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Node } from "./Node";

interface WorkflowCanvasProps {
  executingNodeIds: string[];
}

export function WorkflowCanvas({ executingNodeIds }: WorkflowCanvasProps) {
  const nodes = useQuery(api.nodes.getNodesByWorkflow, { workflowId: "default" });
  const edges = useQuery(api.nodes.getEdgesByWorkflow, { workflowId: "default" });
  const updateNode = useMutation(api.nodes.updateNode);

  return (
    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      {nodes?.map((node) => (
        <Node
          key={node._id}
          node={node}
          onModuleValueChange={handleModuleValueChange}
          onParameterValueChange={handleParameterValueChange}
          isExecuting={executingNodeIds.includes(node.id)}
        />
      ))}

      {/* Edge Info Overlay */}
      {edges && edges.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-900/80 p-2 rounded shadow text-xs text-gray-600 dark:text-gray-400 z-10">
          Connections: {edges.length}
        </div>
      )}

      {nodes === undefined && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Loading nodes...
        </div>
      )}
      {nodes?.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No nodes yet. Describe one below to get started!
        </div>
      )}
    </div>
  );
  
  async function handleModuleValueChange(
    nodeId: string,
    moduleId: string,
    newValue: unknown
  ) {
    if (!nodes) return;

    const nodeToUpdate = nodes.find((node) => node.id === nodeId);
    if (!nodeToUpdate) return;

    const updatedModules = nodeToUpdate.modules?.map((module) =>
      module.id === moduleId ? { ...module, value: newValue } : module
    );

    try {
      await updateNode({
        id: nodeId,
        updates: { modules: updatedModules },
      });
    } catch (error) {
      console.error("Failed to update module value:", error);
    }
  }

  async function handleParameterValueChange(
    nodeId: string,
    parameterId: string,
    newValue: unknown
  ) {
    if (!nodes) return;

    const nodeToUpdate = nodes.find((node) => node.id === nodeId);
    if (!nodeToUpdate) return;

    const updatedParameters = nodeToUpdate.parameters?.map((param) =>
      param.id === parameterId ? { ...param, defaultValue: newValue as string } : param
    );

    try {
      await updateNode({
        id: nodeId,
        updates: { parameters: updatedParameters },
      });
    } catch (error) {
      console.error("Failed to update parameter value:", error);
    }
  }
}
