"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import {
  FaCopy,
  FaDownload,
  FaEraser,
  FaArrowsRotate,
} from "react-icons/fa6";

interface DebugPanelProps {
  workflowId: string;
}

type StepStatus = "pending" | "generating" | "completed" | "failed";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-background-600",
  generating: "bg-yellow-400 animate-pulse",
  completed: "bg-green-400",
  failed: "bg-red-400",
  generating_gen: "bg-yellow-400 animate-pulse",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "text-background-400",
  generating: "text-yellow-400",
  completed: "text-green-400",
  failed: "text-red-400",
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 bg-background-800 border-b border-background-700 sticky top-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-background-400">{children}</span>
    </div>
  );
}

function Row({ label, value, valueClass = "text-background-200" }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-0.5">
      <span className="text-[10px] text-background-500 w-24 shrink-0 pt-px">{label}</span>
      <span className={`text-[10px] font-mono break-all ${valueClass}`}>{value}</span>
    </div>
  );
}

function Collapsible({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="group" open>
      <summary className="flex items-center gap-2 px-3 py-1.5 cursor-pointer list-none hover:bg-background-800/50 select-none">
        <span className="text-background-500 text-[9px] group-open:rotate-90 transition-transform inline-block">▶</span>
        <span className="text-[10px] font-semibold text-background-300">{title}</span>
        {badge}
      </summary>
      <div className="border-l border-background-800 ml-5">{children}</div>
    </details>
  );
}

export function DebugPanel({ workflowId }: DebugPanelProps) {
  const generation = useQuery(api.workflow_generation.getWorkflowGeneration, { workflowId });
  const steps = useQuery(api.workflow_generation.getGenerationSteps, { workflowId });
  const nodes = useQuery(api.nodes.getNodesByWorkflow, { workflowId });
  const edges = useQuery(api.nodes.getEdgesByWorkflow, { workflowId });

  const [copyLabel, setCopyLabel] = useState<string | null>(null);

  const genStatus = generation?.status ?? "—";
  const genStatusColor = STATUS_LABEL[genStatus] ?? "text-background-400";

  const snapshot = { generation, steps, nodes, edges };
  const snapshotJson = JSON.stringify(snapshot, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(snapshotJson).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel(null), 1500);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([snapshotJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-${workflowId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyErrors = () => {
    const errors = (steps ?? [])
      .filter((s) => s.error)
      .map((s) => `[step ${s.stepIndex}] ${s.title}: ${s.error}`)
      .join("\n");
    const text = errors || "(no errors)";
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel("Errors copied!");
      setTimeout(() => setCopyLabel(null), 1500);
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="w-120 shrink-0 rounded-xs bg-background-950 border border-background-700 flex flex-col overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3 py-2 border-b border-background-700 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-background-200">Debug</span>
        <span className={`text-[10px] font-mono uppercase ${genStatusColor}`}>{genStatus}</span>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-background-800">

        {/* Generation record */}
        <section>
          <SectionHeader>Generation</SectionHeader>
          {!generation ? (
            <p className="px-3 py-2 text-[10px] text-background-500 italic">No active generation</p>
          ) : (
            <>
              <Row label="id" value={generation._id} />
              <Row label="workflowId" value={generation.workflowId} />
              <Row label="status" value={generation.status} valueClass={genStatusColor + " font-semibold"} />
              <Row label="steps" value={`${generation.completedSteps} / ${generation.totalSteps}`} />
              <Row label="prompt" value={`"${generation.prompt}"`} valueClass="text-background-300 italic" />
              {generation.error && (
                <Row label="error" value={generation.error} valueClass="text-red-400" />
              )}
            </>
          )}
        </section>

        {/* Generation steps */}
        <section>
          <SectionHeader>Steps ({steps?.length ?? 0})</SectionHeader>
          {!steps || steps.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-background-500 italic">No steps yet</p>
          ) : (
            steps.map((step) => (
              <Collapsible
                key={step._id}
                title={step.title || `Step ${step.stepIndex}`}
                badge={
                  <span className="flex items-center gap-1 ml-auto">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[step.status] ?? "bg-background-600"}`} />
                    <span className={`text-[9px] ${STATUS_LABEL[step.status] ?? "text-background-400"}`}>
                      {step.status}
                    </span>
                  </span>
                }
              >
                <Row label="stepIndex" value={String(step.stepIndex)} />
                <Row label="nodeType" value={step.nodeType} valueClass="text-accent-400" />
                <Row label="label" value={step.suggestedLabel} />
                <Row label="description" value={step.description} valueClass="text-background-300 italic" />
                {step.nodeId && <Row label="nodeId" value={step.nodeId} valueClass="text-green-400" />}
                {step.error && <Row label="error" value={step.error} valueClass="text-red-400 bg-red-950/30 rounded px-1" />}
              </Collapsible>
            ))
          )}
        </section>

        {/* Nodes in DB */}
        <section>
          <SectionHeader>Nodes in DB ({nodes?.length ?? 0})</SectionHeader>
          {!nodes || nodes.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-background-500 italic">No nodes yet</p>
          ) : (
            nodes.map((node) => (
              <Collapsible key={node._id} title={node.label || node.type}>
                <Row label="id" value={node.id} />
                <Row label="type" value={node.type} valueClass="text-accent-400" />
                <Row label="position" value={`x:${node.position?.x ?? "?"} y:${node.position?.y ?? "?"}`} />
                <Row label="inputs" value={`${(node.inputs as unknown[])?.length ?? 0} ports`} />
                <Row label="outputs" value={`${(node.outputs as unknown[])?.length ?? 0} ports`} />
                <Row label="parameters" value={`${(node.parameters as unknown[])?.length ?? 0} params`} />
              </Collapsible>
            ))
          )}
        </section>

        {/* Edges in DB */}
        <section>
          <SectionHeader>Edges in DB ({edges?.length ?? 0})</SectionHeader>
          {!edges || edges.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-background-500 italic">No edges yet</p>
          ) : (
            edges.map((edge) => (
              <div key={edge._id} className="px-3 py-1.5 font-mono text-[10px] flex items-center gap-1 text-background-300">
                <span className="text-green-400 truncate max-w-[6rem]">{edge.source}</span>
                <span className="text-background-600">→</span>
                <span className="text-blue-400 truncate max-w-[6rem]">{edge.target}</span>
              </div>
            ))
          )}
        </section>

        {/* Raw JSON dump */}
        <section>
          <SectionHeader>Raw JSON</SectionHeader>
          <details className="group">
            <summary className="flex items-center gap-2 px-3 py-1.5 cursor-pointer list-none hover:bg-background-800/50 select-none">
              <span className="text-background-500 text-[9px] group-open:rotate-90 transition-transform inline-block">▶</span>
              <span className="text-[10px] text-background-400">Expand</span>
            </summary>
            <pre className="px-3 py-2 text-[9px] text-background-400 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify({ generation, steps, nodes, edges }, null, 2)}
            </pre>
          </details>
        </section>

      </div>

      {/* Toolbar */}
      <div className="border-t border-background-700 bg-background-900 px-2 py-1.5 flex items-center gap-1">
        <button
          onClick={handleCopy}
          title="Copy full snapshot as JSON"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-background-300 hover:bg-background-700 hover:text-background-100 transition-colors"
        >
          <FaCopy size={10} />
          {copyLabel ?? "Copy JSON"}
        </button>

        <button
          onClick={handleCopyErrors}
          title="Copy all step errors to clipboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-background-300 hover:bg-background-700 hover:text-background-100 transition-colors"
        >
          <FaEraser size={10} />
          Copy errors
        </button>

        <button
          onClick={handleDownload}
          title="Download snapshot as .json file"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-background-300 hover:bg-background-700 hover:text-background-100 transition-colors"
        >
          <FaDownload size={10} />
          Download
        </button>

        <button
          onClick={handleReload}
          title="Hard reload the page"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-background-300 hover:bg-background-700 hover:text-background-100 transition-colors ml-auto"
        >
          <FaArrowsRotate size={10} />
          Reload
        </button>
      </div>
    </div>
  );
}
