"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Node } from "./Node";
import { NodeExecutionStatus } from "../convex/schema/nodes";

interface WorkflowCanvasProps {
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeResults?: Record<string, unknown>;
}

export function WorkflowCanvas({ nodeStatuses, nodeResults = {} }: WorkflowCanvasProps) {
  const nodes = useQuery(api.nodes.getNodesByWorkflow, { workflowId: "default" });
  const edges = useQuery(api.nodes.getEdgesByWorkflow, { workflowId: "default" });
  const updateNode = useMutation(api.nodes.updateNode);

  const [draggingNodes, setDraggingNodes] = React.useState<Record<string, { x: number; y: number }>>({});

  const handleNodeDrag = React.useCallback((
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    setDraggingNodes(prev => ({
      ...prev,
      [nodeId]: position
    }));
  }, []);

  const handleModuleValueChange = React.useCallback(async (
    nodeId: string,
    moduleId: string,
    newValue: unknown
  ) => {
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
  }, [nodes, updateNode]);

  const handleParameterValueChange = React.useCallback(async (
    nodeId: string,
    parameterId: string,
    newValue: unknown
  ) => {
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
  }, [nodes, updateNode]);

  const handlePositionChange = React.useCallback(async (
    nodeId: string,
    newPosition: { x: number; y: number }
  ) => {
    try {
      // First, update the database
      await updateNode({
        id: nodeId,
        updates: { position: newPosition },
      });
      // After successful database update, then clear the local dragging state
      setDraggingNodes(prev => {
        const newState = { ...prev };
        delete newState[nodeId];
        return newState;
      });
    } catch (error) {
      console.error("Failed to update node position:", error);
    }
  }, [updateNode]);

  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="min-w-[2000px] min-h-[2000px] relative">
        {nodes?.map((node) => (
          <Node
            key={node._id}
            node={node as any}
            onModuleValueChange={handleModuleValueChange}
            onParameterValueChange={handleParameterValueChange}
            onPositionChange={handlePositionChange}
            onDrag={handleNodeDrag}
            executionStatus={nodeStatuses[node.id] || "idle"}
            result={nodeResults[node.id]}
          />
        ))}

        {/* Edge Visualization */}
        {edges && nodes && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              // Derive edge status from connected nodes using ephemeral nodeStatuses
              const sourceStatus = nodeStatuses[sourceNode.id] || "idle";
              const targetStatus = nodeStatuses[targetNode.id] || "idle";

              let edgeStroke = "var(--color-background-500)";
              let strokeDasharray = "6 6";
              let edgeClassName = "";

              if (sourceStatus === "danger" || targetStatus === "danger") {
                edgeStroke = "var(--color-danger-500)";
                strokeDasharray = "none";
              } else if (sourceStatus === "pending" || targetStatus === "pending") {
                edgeStroke = "var(--color-info-500)";
                strokeDasharray = "10 5";
                edgeClassName = "animate-flow";
              } else if (sourceStatus === "success" && targetStatus === "success") {
                edgeStroke = "var(--color-success-500)";
                strokeDasharray = "none";
              }

              // Use dragging position if available, otherwise use stored position
              const currentSourcePosition = draggingNodes[sourceNode.id] || sourceNode.position;
              const currentTargetPosition = draggingNodes[targetNode.id] || targetNode.position;

              const sourceWidth = sourceNode.type === "Output" ? 320 : 256;

              // Calculate port indices
              const sourcePortIndex = sourceNode.outputs?.findIndex(o => o.id === edge.sourceHandle) ?? 0;
              const targetPortIndex = targetNode.inputs?.findIndex(i => i.id === edge.targetHandle) ?? 0;

              // --- Recalculated Offsets based on Node.tsx layout ---
              const headerHeight = 16; // Accounting for Badge height, padding, and 2px borders
              const ioSectionPaddingTop = 8; // py-2 on the IO Section div
              const portDotOffset = -2; // Align with the center of the port dots (accounts for 2px border)

              const x1 = (currentSourcePosition?.x || 50) + sourceWidth + portDotOffset - 7; // Shifted 7px left
              const y1 = (currentSourcePosition?.y || 50) + headerHeight + ioSectionPaddingTop + sourcePortIndex

              const x2 = (currentTargetPosition?.x || 50) - portDotOffset - 7; // Shifted 7px left
              const y2 = (currentTargetPosition?.y || 50) + headerHeight + ioSectionPaddingTop + targetPortIndex

              // Path calculation: Rounded Orthogonal (Step)
              const midX = x1 + (x2 - x1) / 2;
              const borderRadius = Math.min(20, Math.max(0, (x2 - x1) / 2), Math.abs(y2 - y1) / 2);

              const isUp = y2 < y1;
              const r = isUp ? -borderRadius : borderRadius;

              const d = `
                M ${x1} ${y1}
                L ${midX - borderRadius} ${y1}
                Q ${midX} ${y1} ${midX} ${y1 + r}
                L ${midX} ${y2 - r}
                Q ${midX} ${y2} ${midX + borderRadius} ${y2}
                L ${x2} ${y2}
              `;

              return (
                <g key={edge.id}>
                  {/* Main dashed edge */}
                  <path
                    d={d}
                    fill="none"
                    stroke={edgeStroke}
                    strokeWidth="1.5"
                    strokeDasharray={strokeDasharray}
                    className={edgeClassName}
                  />
                  {/* Interactive/Hover area */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="10"
                    className="pointer-events-auto cursor-pointer"
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {nodes === undefined && (
        <div className="absolute inset-0 flex items-center justify-center">
          Fetching Nodes...
        </div>
      )}
      {nodes?.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          No Nodes Found
        </div>
      )}
    </div>
  );
}
