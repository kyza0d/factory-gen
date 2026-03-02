"use client";

import React, { useRef } from "react";
import Draggable from "react-draggable";
import { UINode, IOParam } from "../convex/schema/nodes";

interface NodeProps {
  node: UINode;
  onModuleValueChange: (nodeId: string, moduleId: string, newValue: unknown) => void;
  onParameterValueChange: (nodeId: string, parameterId: string, newValue: unknown) => void;
  isExecuting: boolean; // New prop
}

const Port: React.FC<{ port: IOParam; type: "input" | "output" }> = ({
  port,
  type,
}) => (
  <div
    className={`flex items-center text-xs py-1 ${
      type === "input" ? "justify-start" : "justify-end"
    }`}
  >
    {type === "input" && (
      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
    )}
    <span className="text-gray-700 dark:text-gray-300">{port.name}</span>
    {type === "output" && (
      <span className="w-2 h-2 rounded-full bg-green-500 ml-2" />
    )}
  </div>
);

export const Node: React.FC<NodeProps> = ({ node, onModuleValueChange, onParameterValueChange, isExecuting }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
    >
      <div
        ref={nodeRef}
        className={`absolute bg-white dark:bg-gray-800 shadow-lg rounded-lg border w-64 cursor-grab active:cursor-grabbing
          ${isExecuting ? "border-green-500 ring-2 ring-green-500 animate-pulse-once" : "border-gray-200 dark:border-gray-700"}`}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {node.label}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Type: {node.type}
          </p>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            {node.inputs && node.inputs.length > 0 && (
              <>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Inputs</p>
                {node.inputs.map((input) => (
                  <Port key={input.id} port={input} type="input" />
                ))}
              </>
            )}
          </div>
          <div className="text-right">
            {node.outputs && node.outputs.length > 0 && (
              <>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Outputs</p>
                {node.outputs.map((output) => (
                  <Port key={output.id} port={output} type="output" />
                ))}
              </>
            )}
          </div>
        </div>
        {node.parameters && node.parameters.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Parameters</p>
            {node.parameters.map((param) => (
              <div key={param.id} className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {param.name}
                </label>
                {(param.type === "string" || !param.type) && !param.options && (
                  <input
                    type="text"
                    defaultValue={param.defaultValue as string || ""}
                    onBlur={(e) => onParameterValueChange(node.id, param.id, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-xs p-1"
                  />
                )}
                {param.options && (
                  <select
                    defaultValue={param.defaultValue as string || ""}
                    onChange={(e) => onParameterValueChange(node.id, param.id, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-xs p-1"
                  >
                    {param.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
        {node.modules && node.modules.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Modules</p>
            {node.modules.map((module) => (
              <div key={module.id} className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {module.label}
                </label>
                {module.type === "text" && (
                  <input
                    type="text"
                    value={module.value || ""}
                    onChange={(e) => onModuleValueChange(node.id, module.id, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 p-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Draggable>
  );
};
