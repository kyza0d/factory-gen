"use client";

import React from "react";
import { ALL_NODES_METADATA } from "@registry/nodes";
import { NodeMetadata } from "@registry/types";
import { resolveNodeIcon } from "@registry/icons";
import { Divider } from "ui-lab-components";

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const idx = t.indexOf(q[qi], ti);
    if (idx === -1) return false;
    ti = idx + 1;
  }
  return true;
}

interface NodePaletteProps {
  onAddNode: (type: string) => void;
  query?: string;
}

export function NodePalette({ onAddNode, query }: NodePaletteProps) {
  const nodes = query
    ? ALL_NODES_METADATA.filter(
        (meta: NodeMetadata) =>
          fuzzyMatch(meta.label, query) ||
          (meta.description ? fuzzyMatch(meta.description, query) : false)
      )
    : ALL_NODES_METADATA;

  if (nodes.length === 0) {
    return <p className="text-xs text-foreground-500 px-2 py-2 italic">No nodes match "{query}"</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {nodes.map((meta: NodeMetadata) => (
        <React.Fragment key={meta.type}>
          <Divider className="hidden not-first:block my-1" size="sm" />
          <button
            onClick={() => onAddNode(meta.type)}
            className="text-left p-2 rounded-xs hover:bg-background-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              {React.createElement(resolveNodeIcon(meta.icon), {
                className: "text-foreground-400 shrink-0",
                size: 12,
              })}
              <p className="text-xs font-semibold text-foreground-200">{meta.label}</p>
            </div>
            {meta.description && (
              <p className="text-xs text-foreground-400 mt-0.5 pl-5">{meta.description}</p>
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
