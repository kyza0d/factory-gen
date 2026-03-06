"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";
import { Node } from "./node";
import { UINode, NodeExecutionStatus } from "@registry/types";
import { api } from "@convex/_generated/api";

interface WorkflowCanvasProps {
  workflowId: string;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeResults?: Record<string, unknown>;
}

export function WorkflowCanvas({ workflowId, nodeStatuses, nodeResults = {} }: WorkflowCanvasProps) {
  const nodes = useQuery(workflowId ? api.nodes.getNodesByWorkflow : (undefined as unknown as any), workflowId ? { workflowId } : (undefined as unknown as any));
  const edges = useQuery(workflowId ? api.nodes.getEdgesByWorkflow : (undefined as unknown as any), workflowId ? { workflowId } : (undefined as unknown as any));
  const updateNode = useMutation(api.nodes.updateNode);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [portPositions, setPortPositions] = React.useState<Record<string, { x: number; y: number }>>({});

  const getCanvasRect = React.useCallback(() => canvasRef.current?.getBoundingClientRect() ?? null, []);

  const handlePortsChange = React.useCallback((_nodeId: string, ports: Record<string, { x: number; y: number }>) => {
    setPortPositions(prev => ({ ...prev, ...ports }));
  }, []);

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

    const nodeToUpdate = nodes.find((node: UINode) => node.id === nodeId);
    if (!nodeToUpdate) return;

    const updatedModules = nodeToUpdate.modules?.map((module: { id: string; type: string; label: string; value: string | null; }) =>
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

    const nodeToUpdate = nodes.find((node: UINode) => node.id === nodeId);
    if (!nodeToUpdate) return;

    const updatedParameters = nodeToUpdate.parameters?.map((param: IOParam) =>
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
    <div className="absolute inset-0" ref={canvasRef}>
      <div className="relative ">
        {nodes?.map((node: UINode) => (
          <Node
            key={node.id}
            node={node as any}
            onModuleValueChange={handleModuleValueChange}
            onParameterValueChange={handleParameterValueChange}
            onPositionChange={handlePositionChange}
            onDrag={handleNodeDrag}
            onPortsChange={handlePortsChange}
            getCanvasRect={getCanvasRect}
            executionStatus={nodeStatuses[node.id] || "idle"}
            result={nodeResults[node.id]}
          />
        ))}

        {/* Edge Visualization */}
        {edges && nodes && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
            {edges.map((edge: { id: string; source: string; sourceHandle: string | null; target: string; targetHandle: string | null; }) => {
              const sourceNode = nodes.find((n: UINode) => n.id === edge.source);
              const targetNode = nodes.find((n: UINode) => n.id === edge.target);
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

              // Look up measured port positions — skip edge if not yet measured
              const sourcePos = edge.sourceHandle ? portPositions[edge.sourceHandle] : null;
              const targetPos = edge.targetHandle ? portPositions[edge.targetHandle] : null;
              if (!sourcePos || !targetPos) return null;

              const x1 = sourcePos.x;
              const y1 = sourcePos.y;
              const x2 = targetPos.x;
              const y2 = targetPos.y;

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
