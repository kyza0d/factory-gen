"use client";

import React, { useRef } from "react";
import Draggable from "react-draggable";
import { UINode, IOParam } from "../convex/schema/nodes";
import { DebouncedInput } from "./DebouncedInput";
import { Badge, Input, Select } from "ui-lab-components";
import { FaRegUser, FaAtom, FaRegEye, FaFileLines, FaRegTrashCan, FaRegImage, FaQuestion } from "react-icons/fa6";

interface NodeProps {
  node: UINode;
  onModuleValueChange: (nodeId: string, moduleId: string, newValue: unknown) => void;
  onParameterValueChange: (nodeId: string, parameterId: string, newValue: unknown) => void;
  onPositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  isExecuting: boolean;
  result?: unknown;
}

const nodeTypeIcons: Record<string, React.ElementType> = {
  UserInput: FaRegUser,
  AIModule: FaAtom,
  PreviewOutput: FaRegEye,
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
      <div className="absolute left-[-4px] w-2 h-2 rounded-full border border-background-600 bg-background-800" />
    )}
    {type === "output" && (
      <div className="absolute right-[-4px] w-2 h-2 rounded-full border border-background-600 bg-background-800" />
    )}
  </div>
);

export const Node: React.FC<NodeProps> = React.memo(({ node, onModuleValueChange, onParameterValueChange, onPositionChange, onDrag, isExecuting, result }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const IconComponent = nodeTypeIcons[node.type] || nodeTypeIcons.default;

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
        className={`absolute bg-background-800 border border-background-600 rounded-sm group ${node.type === "PreviewOutput" ? "w-80" : "w-64"}`}
      >
        <div>
          <div className="flex bg-background-700 p-2 rounded-t-sm border-b border-background-600 items-center justify-between drag-handle">
            <div className="flex items-center gap-2">
              <Badge icon={<IconComponent className="text-foreground-400" />} size="sm" className="bg-background-600">
                {node.type}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
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
          {node.parameters && node.parameters.length > 0 && (
            <div className="p-3">
              <p className="mb-1">Parameters</p>
              {node.parameters.map((param) => (
                <div key={param.id} className="mb-2">
                  <label className="block">
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
                        <Select.Value placeholder="Select an option" />
                      </Select.Trigger>
                      <Select.Content>
                        {param.options.map(opt => (
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
              <p className="text-xs font-medium mb-1">Modules</p>
              {node.modules.map((module) => (
                <div key={module.id} className="mb-2">
                  <label className="block font-medium text-xs">
                    {module.label}
                  </label>
                  {module.type === "text" && (
                    <DebouncedInput
                      type="text"
                      value={module.value || ""}
                      onChange={(newValue) => onModuleValueChange(node.id, module.id, newValue)}
                      className="mt-1 block w-full p-1 no-drag"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {node.type === "PreviewOutput" && result !== undefined && (
            <div className="p-3">
              <p className="text-xs font-medium mb-1">Output</p>
              <pre className="max-h-40 overflow-y-auto bg-background-900 p-2 rounded text-xs text-wrap break-all">
                {String(result)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
});

Node.displayName = 'Node';
