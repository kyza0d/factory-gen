"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";
import { Node } from "./node";
import { UINode, IOParam, NodeExecutionStatus } from "@registry/types";
import { api } from "@convex/_generated/api";
import { connectionReducer } from "../canvas-connection";
import { NodeConfigModal } from "./node-config-modal";

interface WorkflowCanvasProps {
  workflowId: string;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeResults?: Record<string, unknown>;
}

export function WorkflowCanvas({ workflowId, nodeStatuses, nodeResults = {} }: WorkflowCanvasProps) {
  const nodes = useQuery(workflowId ? api.nodes.getNodesByWorkflow : (undefined as unknown as any), workflowId ? { workflowId } : (undefined as unknown as any));
  const edges = useQuery(workflowId ? api.nodes.getEdgesByWorkflow : (undefined as unknown as any), workflowId ? { workflowId } : (undefined as unknown as any));
  const triggers = useQuery(workflowId ? api.triggers.getTriggersByWorkflow : (undefined as unknown as any), workflowId ? { workflowId } : (undefined as unknown as any));
  const updateNode = useMutation(api.nodes.updateNode);
  const createTrigger = useMutation(api.triggers.createTrigger);
  const updateTrigger = useMutation(api.triggers.updateTrigger);
  const createEdge = useMutation(api.nodes.createEdge);
  const deleteEdge = useMutation(api.nodes.deleteEdge);
  const deleteNode = useMutation(api.nodes.deleteNode);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [portPositions, setPortPositions] = React.useState<Record<string, { x: number; y: number }>>({});
  const createdTriggerNodeIds = React.useRef<Set<string>>(new Set());

  // Connection state machine
  const [connectionState, dispatch] = React.useReducer(connectionReducer, { status: "idle" });
  const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);

  // Config modal state (managed at canvas level to avoid Draggable transform stacking issues)
  const [configNodeId, setConfigNodeId] = React.useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const configNode = React.useMemo(
    () => (configNodeId && nodes ? (nodes.find((n: UINode) => n.id === configNodeId) ?? null) : null),
    [configNodeId, nodes]
  );

  // When a completed edge appears, persist it then clear
  React.useEffect(() => {
    if (connectionState.status === "idle" && connectionState.completedEdge) {
      const { sourcePortId, sourceNodeId, targetPortId, targetNodeId } = connectionState.completedEdge;
      createEdge({
        id: crypto.randomUUID(),
        workflowId,
        source: sourceNodeId,
        sourceHandle: sourcePortId,
        target: targetNodeId,
        targetHandle: targetPortId,
      }).catch(console.error);
      dispatch({ type: "CLEAR" });
    }
  }, [connectionState, createEdge, workflowId]);

  // Auto-create a trigger record when a Trigger-type node has no corresponding trigger yet
  React.useEffect(() => {
    if (!nodes || !triggers) return;
    const triggerNodes = nodes.filter((n: UINode) => n.type === "Trigger");
    for (const node of triggerNodes) {
      if (createdTriggerNodeIds.current.has(node.id)) continue;
      const existing = triggers.find((t: any) => t.nodeId === node.id);
      if (!existing) {
        createdTriggerNodeIds.current.add(node.id);
        const typeParam = node.parameters?.find((p: IOParam) => p.id === "trigger-type-param");
        const triggerType = (typeParam?.defaultValue as "webhook" | "cron" | "fileChange" | "httpRequest") ?? "webhook";
        createTrigger({ workflowId, nodeId: node.id, type: triggerType, config: {} }).catch(console.error);
      }
    }
  }, [nodes, triggers, workflowId, createTrigger]);

  const handleTriggerUpdate = React.useCallback(async (triggerId: string, config: Record<string, any>) => {
    try {
      await updateTrigger({ triggerId, config });
    } catch (error) {
      console.error("Failed to update trigger:", error);
    }
  }, [updateTrigger]);

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

  const handlePortClick = React.useCallback((portId: string, portType: "input" | "output", nodeId: string) => {
    if (portType === "output") {
      dispatch({ type: "START", sourcePortId: portId, sourceNodeId: nodeId });
    } else {
      dispatch({ type: "COMPLETE", targetPortId: portId, targetNodeId: nodeId });
    }
  }, []);

  const handleCanvasClick = React.useCallback(() => {
    if (connectionState.status === "connecting") {
      dispatch({ type: "CANCEL" });
    }
    setSelectedNodeId(null);
  }, [connectionState.status]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (connectionState.status !== "connecting") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [connectionState.status]);

  const handleEdgeContextMenu = React.useCallback((e: React.MouseEvent, edgeId: string) => {
    e.preventDefault();
    deleteEdge({ id: edgeId }).catch(console.error);
  }, [deleteEdge]);

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
      await updateNode({
        id: nodeId,
        updates: { position: newPosition },
      });
      setDraggingNodes(prev => {
        const newState = { ...prev };
        delete newState[nodeId];
        return newState;
      });
    } catch (error) {
      console.error("Failed to update node position:", error);
    }
  }, [updateNode]);

  const handleModalSave = React.useCallback(async (values: Record<string, unknown>) => {
    if (!configNode) return;
    const updatedParameters = configNode.parameters?.map((param: IOParam) => ({
      ...param,
      defaultValue: values[param.id] !== undefined ? (values[param.id] as string) : param.defaultValue,
    }));
    try {
      await updateNode({ id: configNode.id, updates: { parameters: updatedParameters } });
    } catch (error) {
      console.error("Failed to update node parameters:", error);
    }
    setConfigNodeId(null);
  }, [configNode, updateNode]);

  const isConnecting = connectionState.status === "connecting";

  return (
    <div
      className={`absolute inset-0${isConnecting ? " cursor-crosshair" : ""}`}
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
      <div className="relative">
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
            trigger={node.type === "Trigger" ? (triggers?.find((t: any) => t.nodeId === node.id) ?? null) : undefined}
            onTriggerUpdate={node.type === "Trigger" ? handleTriggerUpdate : undefined}
            onPortClick={handlePortClick}
            connectionState={connectionState}
            onOpenConfig={setConfigNodeId}
            isSelected={selectedNodeId === node.id}
            onSelect={setSelectedNodeId}
            onDelete={(nodeId) => deleteNode({ id: nodeId })}
          />
        ))}

        {/* Edge Visualization */}
        {edges && nodes && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
            {edges.map((edge: { id: string; source: string; sourceHandle: string | null; target: string; targetHandle: string | null; }) => {
              const sourceNode = nodes.find((n: UINode) => n.id === edge.source);
              const targetNode = nodes.find((n: UINode) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

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

              const sourcePos = edge.sourceHandle ? portPositions[edge.sourceHandle] : null;
              const targetPos = edge.targetHandle ? portPositions[edge.targetHandle] : null;
              if (!sourcePos || !targetPos) return null;

              const x1 = sourcePos.x;
              const y1 = sourcePos.y;
              const x2 = targetPos.x;
              const y2 = targetPos.y;

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
                  {/* Interactive/Hover area — right-click to delete */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="10"
                    className="pointer-events-auto cursor-pointer"
                    onContextMenu={(e) => handleEdgeContextMenu(e, edge.id)}
                    aria-label="Delete edge"
                  />
                </g>
              );
            })}

            {/* Temporary line while connecting */}
            {connectionState.status === "connecting" && cursorPos && portPositions[connectionState.sourcePortId] && (
              <line
                x1={portPositions[connectionState.sourcePortId].x}
                y1={portPositions[connectionState.sourcePortId].y}
                x2={cursorPos.x}
                y2={cursorPos.y}
                stroke="var(--color-accent-500)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="pointer-events-none"
              />
            )}
          </svg>
        )}
      </div>

      {/* Node config modal — rendered at canvas level to avoid Draggable transform stacking issues */}
      <NodeConfigModal
        node={configNode as any}
        onSave={handleModalSave}
        onClose={() => setConfigNodeId(null)}
      />

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
