"use client";

import React, { useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { UINode, IOParam, NodeExecutionStatus } from "../../convex/schema/nodes";
import { DebouncedInput } from "../../../components/ui/debounced-input";
import { Badge, Input, Select } from "ui-lab-components";
import { FaRegUser, FaAtom, FaRegEye, FaFileLines, FaRegTrashCan, FaRegImage, FaQuestion } from "react-icons/fa6";

interface NodeProps {
  node: UINode;
  onModuleValueChange: (nodeId: string, moduleId: string, newValue: unknown) => void;
  onParameterValueChange: (nodeId: string, parameterId: string, newValue: unknown) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onDrag?: (nodeId: string, position: { x: number; y: number }) => void;
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
    data-port-id={port.id}
    data-port-type={type}
    className={`${type === "input" ? "justify-start pl-4" : "justify-end pr-4"
      }`}
  >
    {type === "input" && (
      <div className="absolute left-[-4px] -translate-y-1/2 top-1/2 w-2 h-2 rounded-full border border-background-600 bg-background-800" />
    )}
    {type === "output" && (
      <div className="absolute right-[-4px] -translate-y-1/2 top-1/2 w-2 h-2 rounded-full border border-background-600 bg-background-800" />
    )}
  </div>
);

export const Node: React.FC<NodeProps> = React.memo(({ node, onModuleValueChange, onParameterValueChange, onPositionChange, onDrag, executionStatus, result }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const IconComponent = nodeTypeIcons[node.type] || nodeTypeIcons.default;

  const getBorderColorClass = (status?: NodeExecutionStatus) => {
    switch (status) {
      case "success":
        return "border-success-500";
      case "warning":
        return "border-warning-500";
      case "danger":
        return "border-danger-500";
      case "pending":
        return "border-accent-500 animate-pulse"; // Using info for pending, and animate-pulse for visual feedback
      default:
        return "border-background-600";
    }
  };

  useEffect(() => {
    if (node.type === "Output" && result !== undefined) {
      const textModule = node.modules?.find((m) => m.type === "text");
      if (textModule && textModule.value !== String(result)) {
        onModuleValueChange(node.id, textModule.id, String(result));
      }
    }
  }, [node.id, node.type, node.modules, result, onModuleValueChange]);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      defaultPosition={node.position || { x: 50, y: 50 }}
      onDrag={(_, data) => onDrag?.(node.id, { x: data.x, y: data.y })}
      onStop={(_, data) => onPositionChange(node.id, { x: data.x, y: data.y })}
      handle=".drag-handle"
    >
      <div
        ref={nodeRef}
        className={`absolute bg-background-800 border ${getBorderColorClass(executionStatus)} rounded-sm group ${node.type === "Output" ? "w-80" : "w-64"}`}
      >
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
                {node.inputs?.map((input) => (
                  <Port key={input.id} port={input} type="input" />
                ))}
              </div>
              <div className="flex flex-col">
                {node.outputs?.map((output) => (
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
              {node.parameters.map((param) => (
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
                      defaultValue={param.defaultValue as string || ""}
                      className="rounded-sm overflow-hidden"
                    // onSelectionChange={(e) => onParameterValueChange(node.id, param.id, e.target.value)}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Select an option" className="rounded-xl!" />
                      </Select.Trigger>
                      <Select.Content className="rounded-sm">
                        {param.options.map(opt => (
                          <Select.Item className="rounded-xs" key={opt} value={opt}>{opt}</Select.Item>
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
              {node.modules.map((module) => (
                <div key={module.id} className="mb-2">
                  <label className="block mt-6 font-semibold text-xs">
                    {module.label}
                  </label>
                  {module.type === "text" && (
                    <DebouncedInput
                      value={(node.type === "Output" && result !== undefined) ? String(result) : (module.value || "")}
                      onChange={(newValue) => onModuleValueChange(node.id, module.id, newValue)}
                      className="mt-1 block w-full p-1 no-drag"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
});

Node.displayName = 'Node';
