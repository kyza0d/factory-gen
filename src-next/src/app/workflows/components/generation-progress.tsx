"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface GenerationProgressProps {
  workflowId: string;
}

type StepStatus = "pending" | "generating" | "completed" | "failed";

const STATUS_CONFIG: Record<StepStatus, { icon: string; className: string }> = {
  pending:    { icon: "○", className: "text-background-500" },
  generating: { icon: "◌", className: "text-accent-400 animate-pulse" },
  completed:  { icon: "●", className: "text-green-400" },
  failed:     { icon: "✕", className: "text-red-400" },
};

export function GenerationProgress({ workflowId }: GenerationProgressProps) {
  const generation = useQuery(api.workflow_generation.getWorkflowGeneration, { workflowId });
  const steps = useQuery(api.workflow_generation.getGenerationSteps, { workflowId });

  if (!generation || generation.status === "completed") return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-80 bg-background-900 border border-background-700 rounded-lg shadow-lg p-3 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-background-300 uppercase tracking-wide">
          Building workflow
        </span>
        <span className="text-xs text-background-500">
          {generation.completedSteps}/{generation.totalSteps}
        </span>
      </div>

      {(steps ?? []).map((step) => {
        const cfg = STATUS_CONFIG[step.status as StepStatus] ?? STATUS_CONFIG.pending;
        return (
          <div
            key={step._id}
            className="flex items-center gap-2 py-0.5"
          >
            <span className={`text-xs font-mono w-3 text-center ${cfg.className}`}>
              {cfg.icon}
            </span>
            <span className={`text-xs ${step.status === "pending" ? "text-background-500" : "text-background-200"}`}>
              {step.title}
            </span>
          </div>
        );
      })}

      {generation.status === "failed" && (
        <p className="text-xs text-red-400 mt-1">{generation.error ?? "Generation failed"}</p>
      )}
    </div>
  );
}
