"use client";

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import Draggable from "react-draggable";
import { UINode, IOParam, NodeExecutionStatus } from "@registry/types";
import { NodeMetadataRegistry } from "@registry/nodes";
import { Badge, Button, Input, Label, Select } from "ui-lab-components";
import { FaGear, FaTrashCan } from "react-icons/fa6";
import { resolveNodeIcon } from "@registry/icons";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { TriggerNodeConfig } from "./trigger-node-config";
import { ConnectionState } from "../canvas-connection";
import { cn } from "@/lib/cn";

const GRID_SIZE = 25;
const MIN_WIDTH = 150; // 6 grid cells
const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

interface NodeProps {
  node: UINode;
  onModuleValueChange: (nodeId: string, moduleId: string, newValue: unknown) => void;
  onParameterValueChange: (nodeId: string, parameterId: string, newValue: unknown) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onDragStart?: (nodeId: string) => void;
  onDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  onDragEnd?: (nodeId: string) => void;
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
  onDetach?: (nodeId: string) => void;
}


interface PortProps {
  port: IOParam;
  type: "input" | "output";
  onPortClick?: (portId: string, portType: "input" | "output") => void;
  disabled?: boolean;
}

const Port: React.FC<PortProps> = ({ port, type, onPortClick, disabled }) => {
  const isInput = type === "input";
  return (
    <div className={isInput ? "justify-start pl-4" : "justify-end pr-4"}>
      {/* Transparent hitbox — larger touch/click target centered on the port */}
      <div
        onClick={disabled ? undefined : (e) => { e.stopPropagation(); onPortClick?.(port.id, type); }}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-8",
          isInput ? "left-[-12px]" : "right-[-12px]",
          !disabled && "cursor-crosshair group/port",
        )}
        aria-label={`${isInput ? "Input" : "Output"} port ${port.name}`}
      >
        {/* Visual dot — position tracked for wire connections */}
        <div
          data-port-id={port.id}
          data-port-type={type}
          className={cn(
            "w-2 h-2 border border-background-600 bg-background-800",
            !disabled && "group-hover/port:bg-accent-500",
          )}
        />
      </div>
    </div>
  );
};

export const Node: React.FC<NodeProps> = React.memo(({ node, onModuleValueChange, onParameterValueChange, onPositionChange, onDragStart, onDrag, onDragEnd, onPortsChange, getCanvasRect, executionStatus, result, trigger, onTriggerUpdate, onPortClick, connectionState, onOpenConfig, isSelected, onSelect, onDelete, onDetach }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const IconComponent = resolveNodeIcon(NodeMetadataRegistry[node.type]?.icon);

  const defaultWidth = node.type === "Output" ? 300 : 250;
  const [localWidth, setLocalWidth] = useState(() => snapToGrid(defaultWidth));
  const [localPosition, setLocalPosition] = useState(() => ({
    x: snapToGrid(node.position?.x ?? 50),
    y: snapToGrid(node.position?.y ?? 50),
  }));
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const [localHeight, setLocalHeight] = useState<number | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const portOffsets = useRef<Record<string, { x: number; y: number }>>({});

  const measurePortOffsets = useCallback(() => {
    if (!nodeRef.current) return;
    const nodeRect = nodeRef.current.getBoundingClientRect();
    const portEls = nodeRef.current.querySelectorAll<HTMLElement>("[data-port-id]");
    const offsets: Record<string, { x: number; y: number }> = {};
    portEls.forEach((el) => {
      const portId = el.dataset.portId;
      if (!portId) return;
      const rect = el.getBoundingClientRect();
      offsets[portId] = {
        x: rect.left + rect.width / 2 - nodeRect.left,
        y: rect.top + rect.height / 2 - nodeRect.top,
      };
    });
    portOffsets.current = offsets;
  }, []);

  const reportPorts = useCallback((position: { x: number; y: number }) => {
    if (!onPortsChange) return;
    const positions: Record<string, { x: number; y: number }> = {};
    Object.entries(portOffsets.current).forEach(([portId, offset]) => {
      positions[portId] = {
        x: position.x + offset.x,
        y: position.y + offset.y,
      };
    });
    onPortsChange(node.id, positions);
  }, [node.id, onPortsChange]);

  // Measure offsets whenever size or structure might change
  useLayoutEffect(() => {
    measurePortOffsets();
  }, [localWidth, minHeight, measurePortOffsets, node.inputs, node.outputs]);

  // Report absolute positions whenever node moves or offsets change
  useLayoutEffect(() => {
    reportPorts(localPosition);
  }, [localPosition, reportPorts]);

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

  const handleGearClick = useCallback(() => {
    onOpenConfig?.(node.id);
  }, [onOpenConfig, node.id]);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      defaultPosition={localPosition}
      grid={[GRID_SIZE, GRID_SIZE]}
      onStart={() => {
        setIsDragging(true);
        onDragStart?.(node.id);
      }}
      onDrag={(_, data) => {
        const pos = { x: data.x, y: data.y };
        reportPorts(pos);
        onDrag?.(node.id, pos);
      }}
      onStop={(_, data) => {
        setIsDragging(false);
        onDragEnd?.(node.id);
        const pos = { x: data.x, y: data.y };
        setLocalPosition(pos);
        reportPorts(pos);
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
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDetach?.(node.id);
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
          <div className={cn("relative cursor-grab", isDragging && "cursor-grabbing")}>
            {isSelected && (
              <div className="absolute -top-12 left-0 flex items-center gap-1 bg-background-800 border border-background-700 rounded-xs px-1 py-0.5 z-10" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="p-2 hover:bg-background-600 text-foreground-400" size="sm" onPress={handleGearClick} aria-label="Configure node" icon={{ left: <FaGear size={11} /> }} />
                <Button variant="ghost" className="p-2 hover:bg-background-600 text-foreground-400" size="sm" onPress={() => onDelete?.(node.id)} aria-label="Delete node" icon={{ left: <FaTrashCan size={11} /> }} />
              </div>
            )}
            <div className={`flex ${isDragging ? "bg-background-600" : "bg-background-700"} p-2 rounded-t-sm border-b border-background-600 items-center justify-between drag-handle`}>
              <div className="flex items-center gap-2">
                <Badge icon={<IconComponent className="text-foreground-400" />} size="sm" className="gap-3 border-none bg-transparent">
                  <span className="text-xs font-body-normal">{node.label}</span>
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
                {node.modules && node.modules.filter((m: any) => m.enabled).length > 0 && (
                  <div className="px-3 pb-3">
                    {node.modules.filter((m: any) => m.enabled).map((module: { id: string; type: string; label: string; value: string | null; enabled: boolean; }) => (
                      <div key={module.id} className="mb-2">
                        <Label size="sm" styles="block font-semibold text-foreground-400">
                          {module.label}
                        </Label>
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
                          <Input
                            readOnly
                            value={module.value ?? ""}
                            placeholder="No events yet"
                            styles="text-xs mt-1"
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
                        <Label size="sm" styles="capitalize font-semibold block">
                          {param.name}
                        </Label>
                        {(param.type === "string" || !param.type) && !param.options && (
                          <Input
                            type="text"
                            defaultValue={param.defaultValue as string || ""}
                            onBlur={(e) => onParameterValueChange(node.id, param.id, e.target.value)}
                          />
                        )}
                        {param.options && (
                          <Select
                            selectedKey={param.defaultValue as string || undefined}
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
                {node.modules && node.modules.filter((m: any) => m.enabled).length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold mb-1">Modules</p>
                    {node.modules.filter((m: any) => m.enabled).map((module: { id: string; type: string; label: string; value: string | null; enabled: boolean; }) => (
                      <div key={module.id} className="mb-2">
                        <Label size="sm" styles="block mt-6 font-semibold">
                          {module.label}
                        </Label>
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
    </Draggable >
  );
});

Node.displayName = 'Node';
