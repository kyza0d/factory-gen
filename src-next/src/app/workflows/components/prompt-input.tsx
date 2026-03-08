"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useAction, useMutation } from "convex/react";
import { Button, Input, useAnimatedWidth } from "ui-lab-components";
import { FaArrowTurnUp, FaPencil, FaCheck, FaRotateRight } from "react-icons/fa6";
import { api } from "@convex/_generated/api";

// Toggle to TEST the UI without calling backend functions
const TEST = false;

interface PromptInputProps {
  workflowId: string;
}

type GenerationStage = "idle" | "queued" | "processing" | "succeeded" | "failed";

function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <svg viewBox="0 0 50 50" className="w-8 h-8 animate-spin">
        <circle
          className="path path-1"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
          stroke="var(--color-accent-500)"
          strokeLinecap="round"
          style={{
            animation: "dash-sync 1.5s ease-in-out infinite",
            strokeDasharray: "1, 125",
            strokeDashoffset: "0",
          }}
        />
        <circle
          className="path path-2"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
          stroke="var(--color-background-500)"
          strokeLinecap="round"
          style={{
            animation: "dash-sync 1.5s ease-in-out infinite -0.75s",
            strokeDasharray: "1, 125",
            strokeDashoffset: "0",
          }}
        />
        <style>{`
          @keyframes dash-sync {
            0% {
              stroke-dasharray: 1, 125;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 60, 125;
              stroke-dashoffset: -30;
            }
            100% {
              stroke-dasharray: 60, 125;
              stroke-dashoffset: -125;
            }
          }
        `}</style>
      </svg>
    </div>
  );
}

export function PromptInput({ workflowId }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<GenerationStage>("idle");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animationRef = useAnimatedWidth({
    duration: 200,
    easing: "cubic-bezier(0.25, 0, 0.25, 1)",
    trigger: stage,
  });

  const generateNode = useAction(api.workflow_actions.generateNode);
  const createNode = useMutation(api.nodes.createNode);

  const initiateWorkflowGeneration = useAction(api.workflow_generation.initiateWorkflowGeneration);

  useEffect(() => {
    if (stage === "queued") {
      const t = setTimeout(() => setStage("processing"), 800);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !workflowId) return;

    setStage("queued");

    if (TEST) {
      // Simulate the flow without calling backend
      setPrompt("");
      setTimeout(() => {
        setStage("succeeded");
        setTimeout(() => setStage("idle"), 2000);
      }, 1800); // Simulate processing time (queued 800ms + processing 1000ms)
      return;
    }

    try {
      if (
        prompt.toLowerCase().includes("workflow") ||
        prompt.toLowerCase().includes("process") ||
        prompt.toLowerCase().includes("graph") ||
        prompt.toLowerCase().includes("sequence") ||
        prompt.toLowerCase().includes("pipeline")
      ) {
        // Streaming generation: plan + per-node actions run in background
        await initiateWorkflowGeneration({ prompt, workflowId });
      } else {
        const generatedNode = await generateNode({ prompt, workflowId });
        await createNode({ ...(generatedNode as any), workflowId });
      }
      setPrompt("");
      setStage("succeeded");
      setTimeout(() => setStage("idle"), 2000);
    } catch (error) {
      console.error("Failed to generate:", error);
      setStage("failed");
      setTimeout(() => setStage("idle"), 2000);
    }
  };

  const stageConfig: Record<
    GenerationStage,
    { label: string; icon: React.ReactNode; variant: "primary" | "secondary"; disabled: boolean }
  > = {
    idle: { label: "Send", icon: <FaArrowTurnUp className="rotate-90 w-4" />, variant: "secondary", disabled: false },
    queued: { label: "Queued…", icon: <Spinner />, variant: "secondary", disabled: true },
    processing: { label: "Processing…", icon: <Spinner />, variant: "secondary", disabled: true },
    succeeded: { label: "Done!", icon: <FaCheck className="w-4" />, variant: "secondary", disabled: true },
    failed: { label: "Retry", icon: <FaRotateRight className="w-4" />, variant: "secondary", disabled: false },
  };

  const cfg = stageConfig[stage];

  return (
    <div className="flex flex-col space-y-0 w-110">
      {stage !== "idle" && (
        <div className="ml-10 px-3 py-1.5 bg-background-800 border border-background-700 rounded text-xs font-medium">
          {cfg.label}
        </div>
      )}
      {/* Unified Generation Control */}
      <form onSubmit={handleSubmit} className="relative w-120 h-14 mx-auto">
        <Input
          type="text"
          variant="ghost"
          value={prompt}
          prefixIcon={<FaPencil className="ml-2" />}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe Module or Workflow..."
          className="bg-background-900 ring ring-background-700 w-full pl-12 pr-16 h-14 rounded-full"
          disabled={stage !== "idle" && stage !== "failed"}
        />
        <div
          ref={animationRef}
          className="absolute right-2 top-2 flex items-center justify-center h-10 w-10"
        >
          <button
            type="submit"
            disabled={cfg.disabled}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-background-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => {
              if (stage === "failed") {
                setStage("idle");
              }
            }}
          >
            {cfg.icon}
          </button>
        </div>
      </form>
    </div>
  );
}

