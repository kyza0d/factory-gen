"use client";

import { PromptInput } from "../components/PromptInput";
import { WorkflowCanvas } from "../components/WorkflowCanvas";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { ExecutionEvent } from "../convex/ai"; // Import ExecutionEvent
import { Button } from "ui-lab-components";
import { FaPlay } from "react-icons/fa6";

export default function Home() {
  const executeWorkflow = useAction(api.ai.executeWorkflow);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingNodeIds, setExecutingNodeIds] = useState<string[]>([]);
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);
  const [nodeResults, setNodeResults] = useState<Record<string, unknown>>({});

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setWorkflowResult(null); // Clear previous results
    setExecutingNodeIds([]); // Clear previous executing nodes
    setNodeResults({}); // Clear previous node results

    try {
      const result = await executeWorkflow({ workflowId: "default" });
      const { events, finalOutput } = result as { events: ExecutionEvent[], finalOutput: string };

      for (const event of events) {
        if (event.status === "started") {
          setExecutingNodeIds((prev) => [...prev, event.nodeId]);
        } else if (event.status === "completed") {
          setNodeResults((prev) => ({ ...prev, [event.nodeId]: event.output }));
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay for visual feedback
          setExecutingNodeIds((prev) => prev.filter((id) => id !== event.nodeId));
        }
      }
      // Removed alert as requested to improve the output flow
      setWorkflowResult(finalOutput);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      alert(`Failed to execute workflow: ${(error as Error).message}`);
      setExecutingNodeIds([]); // Clear executing nodes on error
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <div className="absolute top-4 inset-x-0 mx-auto z-10 w-fit bg-background-900 border border-background-700 rounded-full">
        <Button
          onClick={handleExecuteWorkflow}
          disabled={isExecuting}
          icon={{ left: <FaPlay /> }}
          className="rounded-full px-4 py-2"
        >
          {isExecuting ? "Running..." : "Run Workflow"}
        </Button>
      </div>

      <main className="grid-paper isolate flex-1 relative overflow-hidden">
        <WorkflowCanvas executingNodeIds={executingNodeIds} nodeResults={nodeResults} />
      </main>

      <footer className="absolute bottom-4 p-2 right-0 left-0 mx-auto z-10 w-fit bg-background-900 border border-background-700 rounded-full">
        <PromptInput />
      </footer>
    </div>
  );
}
