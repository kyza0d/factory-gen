"use client";

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import Draggable from "react-draggable";
import { UINode, IOParam, NodeExecutionStatus } from "@registry/types";
import { Badge, Input, Select } from "ui-lab-components";
import { FaRegUser, FaAtom, FaRegEye, FaFileLines, FaRegTrashCan, FaRegImage, FaQuestion } from "react-icons/fa6";
import { DebouncedInput } from "@/components/ui/debounced-input";

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
}

const nodeTypeIcons: Record<string, React.ElementType> = {
  Input: FaRegUser,
  AI: FaAtom,
  Output: FaRegEye,
  TextSummarizer: FaFileLines,
  ImageGenerator: FaRegImage,
  InvalidNode: FaRegTrashCan,
  // Default icon for unknown node types
  default: FaQuestion,
};

const Port: React.FC<{ port: IOParam; type: "input" | "output" }> = ({
  port,
  type,
}) => (
  <div
    className={`${type === "input" ? "justify-start pl-4" : "justify-end pr-4"
      }`}
  >
    {type === "input" && (
      <div
        data-port-id={port.id}
        data-port-type={type}
        className="absolute left-[-4px] -translate-y-1/2 top-1/2 w-2 h-2 border border-background-600 bg-background-800"
      />
    )}
    {type === "output" && (
      <div
        data-port-id={port.id}
        data-port-type={type}
        className="absolute right-[-4px] -translate-y-1/2 top-1/2 w-2 h-2 border border-background-600 bg-background-800"
      />
    )}
  </div>
);

export const Node: React.FC<NodeProps> = React.memo(({ node, onModuleValueChange, onParameterValueChange, onPositionChange, onDrag, onPortsChange, getCanvasRect, executionStatus, result }) => {
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
        className={`absolute bg-background-800 border ${getBorderColorClass(executionStatus)} rounded-sm group`}
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
                    <Port key={input.id} port={input} type="input" />
                  ))}
                </div>
                <div className="flex flex-col">
                  {node.outputs?.map((output: IOParam) => (
                    <Port key={output.id} port={output} type="output" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
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
                      // defaultValue={param.defaultValue as string || ""}
                      // onSelectionChange={(e) => onParameterValueChange(node.id, param.id, e.target.value)}
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
          </div>
        </div>
      </div>
    </Draggable>
  );
});

Node.displayName = 'Node';
