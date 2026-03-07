"use client";

import React from "react";
import { ALL_NODES_METADATA } from "@registry/nodes";
import { NodeMetadata } from "@registry/types";

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {ALL_NODES_METADATA.map((meta: NodeMetadata) => (
        <button
          key={meta.type}
          onClick={() => onAddNode(meta.type)}
          className="text-left p-2 rounded-sm bg-background-800 hover:bg-background-700 border border-background-600 transition-colors"
        >
          <p className="text-xs font-semibold text-foreground-100">{meta.label}</p>
          {meta.description && (
            <p className="text-xs text-foreground-400 mt-0.5">{meta.description}</p>
          )}
        </button>
      ))}
    </div>
  );
}
