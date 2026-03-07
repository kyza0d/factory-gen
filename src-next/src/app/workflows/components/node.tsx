"use client";

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import Draggable from "react-draggable";
import { UINode, IOParam, NodeExecutionStatus } from "@registry/types";
import { Badge, Input, Select } from "ui-lab-components";
import { FaRegUser, FaAtom, FaRegEye, FaFileLines, FaRegTrashCan, FaRegImage, FaQuestion, FaBolt, FaGear } from "react-icons/fa6";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { TriggerNodeConfig } from "./trigger-node-config";
import { ConnectionState } from "../canvas-connection";

const GRID_SIZE = 25;
const MIN_WIDTH = 150; // 6 grid cells
const snapToGrid = (value: number) => Math.ceil(value / GRID_SIZE) * GRID_SIZE;

interface NodeProps {
  node: UINode;
  onModuleValueChange: (nodeId: string, moduleId: string, newValue: unknown) => void;
  onParameterValueChange: (nodeId: string, parameterId: string, newValue: unknown) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  onPortsChange?: (nodeId: string, ports: Record<string, { x: number; y: number }>) => void;
  getCanvasRect?: () => DOMRect | null;
  executionStatus?: NodeExecutionStatus;
  result?: unknown;
  trigger?: Record<string, any> | null;
  onTriggerUpdate?: (triggerId: string, config: Record<string, any>) => void;
  onPortClick?: (portId: string, portType: "input" | "output", nodeId: string) => void;
  connectionState?: ConnectionState;
  onOpenConfig?: (nodeId: string) => void;
  isSelected?: boolean;
  onSelect?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

const nodeTypeIcons: Record<string, React.ElementType> = {
  Input: FaRegUser,
  AI: FaAtom,
  Output: FaRegEye,
  TextSummarizer: FaFileLines,
  ImageGenerator: FaRegImage,
  InvalidNode: FaRegTrashCan,
  Trigger: FaBolt,
  // Default icon for unknown node types
  default: FaQuestion,
};

interface PortProps {
  port: IOParam;
  type: "input" | "output";
  onPortClick?: (portId: string, portType: "input" | "output") => void;
  disabled?: boolean;
}

const Port: React.FC<PortProps> = ({ port, type, onPortClick, disabled }) => (
  <div
    className={`${type === "input" ? "justify-start pl-4" : "justify-end pr-4"}`}
  >
    {type === "input" && (
      <div
        data-port-id={port.id}
        data-port-type={type}
        onClick={disabled ? undefined : (e) => { e.stopPropagation(); onPortClick?.(port.id, type); }}
        className={`absolute left-[-4px] mt-1 -translate-y-1/2 top-1/2 w-2 h-2 border border-background-600 bg-background-800${disabled ? "" : " cursor-crosshair hover:bg-accent-500"}`}
        aria-label={`Input port ${port.name}`}
      />
    )}
    {type === "output" && (
      <div
        data-port-id={port.id}
        data-port-type={type}
        onClick={disabled ? undefined : (e) => { e.stopPropagation(); onPortClick?.(port.id, type); }}
        className={`absolute right-[-4px] mt-1 -translate-y-1/2 top-1/2 w-2 h-2 border border-background-600 bg-background-800${disabled ? "" : " cursor-crosshair hover:bg-accent-500"}`}
        aria-label={`Output port ${port.name}`}
      />
    )}
  </div>
);

export const Node: React.FC<NodeProps> = React.memo(({ node, onModuleValueChange, onParameterValueChange, onPositionChange, onDrag, onPortsChange, getCanvasRect, executionStatus, result, trigger, onTriggerUpdate, onPortClick, connectionState, onOpenConfig, isSelected, onSelect, onDelete }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const IconComponent = nodeTypeIcons[node.type] || nodeTypeIcons.default;

  const defaultWidth = node.type === "Output" ? 300 : 250;
  const [localWidth, setLocalWidth] = useState(() => snapToGrid(defaultWidth));
  const [localPosition, setLocalPosition] = useState(() => ({
    x: node.position?.x ?? 50,
    y: node.position?.y ?? 50,
  }));
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const [localHeight, setLocalHeight] = useState<number | undefined>(undefined);

  const measureAndReportPorts = useCallback(() => {
    if (!nodeRef.current || !onPortsChange || !getCanvasRect) return;
    const canvasRect = getCanvasRect();
    if (!canvasRect) return;
    const portEls = nodeRef.current.querySelectorAll<HTMLElement>("[data-port-id]");
    const positions: Record<string, { x: number; y: number }> = {};
    portEls.forEach((el) => {
      const portId = el.dataset.portId;
      if (!portId) return;
      const rect = el.getBoundingClientRect();
      positions[portId] = {
        x: rect.left + rect.width / 2 - canvasRect.left,
        y: rect.top + rect.height / 2 - canvasRect.top,
      };
    });
    onPortsChange(node.id, positions);
  }, [node.id, onPortsChange, getCanvasRect]);

  // Auto-snap height to grid: measure inner content height, apply snapped minHeight to outer
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const height = Math.round(entries[0].borderBoxSize[0].blockSize);
      if (height > 0) setMinHeight(snapToGrid(height));
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const getBorderColorClass = (status?: NodeExecutionStatus) => {
    switch (status) {
      case "success": return "border-success-500";
      case "warning": return "border-warning-500";
      case "danger": return "border-danger-500";
      case "pending": return "border-accent-500 animate-pulse";
      default: return "border-background-600";
    }
  };

  useLayoutEffect(() => {
    measureAndReportPorts();
  }, [localPosition, localWidth, minHeight, measureAndReportPorts]);

  useEffect(() => {
    if (node.type === "Output" && result !== undefined) {
      const textModule = node.modules?.find((m: { id: string; type: string; label: string; value: string | null; }) => m.type === "text");
      if (textModule && textModule.value !== String(result)) {
        onModuleValueChange(node.id, textModule.id, String(result));
      }
    }
  }, [node.id, node.type, node.modules, result, onModuleValueChange]);

  // Resize handle: all start values captured in a ref to avoid stale closure issues
  const resizeState = useRef<{
    startClientX: number;
    startClientY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeState.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: localWidth,
      startHeight: nodeRef.current?.getBoundingClientRect().height ?? (minHeight ?? 0),
    };
  }, [localWidth, minHeight]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeState.current) return;
    const { startClientX, startClientY, startWidth, startHeight } = resizeState.current;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    setLocalWidth(Math.max(MIN_WIDTH, snapToGrid(startWidth + dx)));
    setLocalHeight(Math.max(minHeight ?? 0, snapToGrid(startHeight + dy)));
  }, [minHeight]);

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!resizeState.current) return;
    const { startClientX, startClientY, startWidth, startHeight } = resizeState.current;
    resizeState.current = null;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    setLocalWidth(Math.max(MIN_WIDTH, snapToGrid(startWidth + dx)));
    setLocalHeight(Math.max(minHeight ?? 0, snapToGrid(startHeight + dy)));
  }, [minHeight]);

  const isSourceNode = connectionState?.status === "connecting" && connectionState.sourceNodeId === node.id;

  const handlePortClickForNode = useCallback((portId: string, portType: "input" | "output") => {
    onPortClick?.(portId, portType, node.id);
  }, [onPortClick, node.id]);

  const handleGearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenConfig?.(node.id);
  }, [onOpenConfig, node.id]);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      position={localPosition}
      grid={[GRID_SIZE, GRID_SIZE]}
      onDrag={(_, data) => {
        const pos = { x: data.x, y: data.y };
        setLocalPosition(pos);
        onDrag?.(node.id, pos);
      }}
      onStop={(_, data) => {
        const pos = { x: data.x, y: data.y };
        setLocalPosition(pos);
        onPositionChange(node.id, pos);
      }}
      handle=".drag-handle"
    >
      <div
        ref={nodeRef}
        style={{ width: localWidth, height: localHeight, minHeight }}
        className={`z-99 absolute bg-background-800 border ${getBorderColorClass(executionStatus)} rounded-sm group${isSelected ? " ring-2 ring-accent-500" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(node.id);
        }}
      >
        {/* Bottom-right corner resize handle */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10 opacity-0 group-hover:opacity-100"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        />

        {/* Inner content div — measured for height snapping */}
        <div ref={contentRef}>
          <div className="relative">
            {isSelected && (
              <div className="absolute -top-8 right-0 flex items-center gap-1 bg-background-700 border border-background-600 rounded-sm px-1 py-0.5 z-10">
                {node.parameters && node.parameters.length > 0 && (
                  <button onClick={handleGearClick} className="p-1 rounded-xs text-foreground-400 hover:text-foreground-100 hover:bg-background-600" aria-label="Configure node">
                    <FaGear size={11} />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDelete?.(node.id); }} className="p-1 rounded-xs text-foreground-400 hover:text-danger-400 hover:bg-background-600" aria-label="Delete node">
                  <FaRegTrashCan size={11} />
                </button>
              </div>
            )}
            <div className="flex bg-background-700 p-2 rounded-t-sm border-b border-background-600 items-center justify-between drag-handle">
              <div className="flex items-center gap-2">
                <Badge icon={<IconComponent className="text-foreground-400" />} size="sm" className="bg-background-600">
                  {node.label}
                </Badge>
              </div>
            </div>
            {/* IO Section */}
            {((node.inputs && node.inputs.length > 0) || (node.outputs && node.outputs.length > 0)) && (
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  {node.inputs?.map((input: IOParam) => (
                    <Port
                      key={input.id}
                      port={input}
                      type="input"
                      onPortClick={handlePortClickForNode}
                      disabled={isSourceNode}
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  {node.outputs?.map((output: IOParam) => (
                    <Port
                      key={output.id}
                      port={output}
                      type="output"
                      onPortClick={handlePortClickForNode}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {node.type === "Trigger" ? (
              <>
                <TriggerNodeConfig
                  triggerType={(node.parameters?.find((p: IOParam) => p.id === "trigger-type-param")?.defaultValue as "webhook" | "cron" | "fileChange" | "httpRequest") ?? "webhook"}
                  trigger={trigger}
                  workflowId={(trigger as any)?.workflowId ?? ""}
                  nodeId={node.id}
                  onTypeChange={(newType) => {
                    onParameterValueChange(node.id, "trigger-type-param", newType);
                    if (trigger?._id && onTriggerUpdate) {
                      onTriggerUpdate(trigger._id, { type: newType });
                    }
                  }}
                  onConfigChange={(config) => {
                    if (trigger?._id && onTriggerUpdate) {
                      onTriggerUpdate(trigger._id, config);
                    }
                  }}
                />
                {node.modules && node.modules.length > 0 && (
                  <div className="px-3 pb-3">
                    {node.modules.map((module: { id: string; type: string; label: string; value: string | null; }) => (
                      <div key={module.id} className="mb-2">
                        <label className="block font-semibold text-xs text-foreground-400">
                          {module.label}
                        </label>
                        {module.type === "badge" && (
                          <div className="mt-1">
                            <Badge
                              size="sm"
                              className={
                                module.value === "listening"
                                  ? "bg-success-900 text-success-300"
                                  : module.value === "paused"
                                  ? "bg-warning-900 text-warning-300"
                                  : module.value === "error"
                                  ? "bg-danger-900 text-danger-300"
                                  : "bg-background-600 text-foreground-400"
                              }
                            >
                              {module.value ?? "idle"}
                            </Badge>
                          </div>
                        )}
                        {module.type === "text" && (
                          <input
                            readOnly
                            value={module.value ?? ""}
                            placeholder="No events yet"
                            className="text-xs mt-1 block w-full p-1 bg-background-700 border border-background-600 rounded text-foreground-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {node.parameters && node.parameters.length > 0 && (
                  <div className="p-3">
                    <p className="mb-1 text-xs font-semibold">Parameters</p>
                    {node.parameters.map((param: IOParam) => (
                      <div key={param.id} className="mb-2">
                        <label className="text-xs capitalize font-semibold block">
                          {param.name}
                        </label>
                        {(param.type === "string" || !param.type) && !param.options && (
                          <Input
                            type="text"
                            defaultValue={param.defaultValue as string || ""}
                            onBlur={(e) => onParameterValueChange(node.id, param.id, e.target.value)}
                          />
                        )}
                        {param.options && (
                          <Select
                            defaultSelectedKey={param.defaultValue as string || undefined}
                            valueLabel={param.defaultValue as string || undefined}
                            onSelectionChange={(key) => onParameterValueChange(node.id, param.id, key)}
                          >
                            <Select.Trigger>
                              <Select.Value placeholder="Select an option" className="rounded-xl!" />
                            </Select.Trigger>
                            <Select.Content>
                              {param.options.map((opt: string) => (
                                <Select.Item key={opt} value={opt}>{opt}</Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {node.modules && node.modules.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold mb-1">Modules</p>
                    {node.modules.map((module: { id: string; type: string; label: string; value: string | null; }) => (
                      <div key={module.id} className="mb-2">
                        <label className="block mt-6 font-semibold text-xs">
                          {module.label}
                        </label>
                        {module.type === "text" && (
                          <DebouncedInput
                            value={(node.type === "Output" && result !== undefined) ? String(result) : (module.value || "")}
                            onChange={(newValue) => onModuleValueChange(node.id, module.id, newValue)}
                            className="text-xs mt-1 block w-full p-1 no-drag"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
});

Node.displayName = 'Node';
