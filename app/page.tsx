"use client";

import { PromptInput } from "../components/PromptInput";
import { WorkflowCanvas } from "../components/WorkflowCanvas";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { ExecutionEvent } from "../convex/ai"; // Import ExecutionEvent

export default function Home() {
  const executeWorkflow = useAction(api.ai.executeWorkflow);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingNodeIds, setExecutingNodeIds] = useState<string[]>([]);
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setWorkflowResult(null); // Clear previous results
    setExecutingNodeIds([]); // Clear previous executing nodes

    try {
      const result = await executeWorkflow({ workflowId: "default" });
      const { events, finalOutput } = result as { events: ExecutionEvent[], finalOutput: string };

      for (const event of events) {
        if (event.status === "started") {
          setExecutingNodeIds((prev) => [...prev, event.nodeId]);
        } else if (event.status === "completed") {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay for visual feedback
          setExecutingNodeIds((prev) => prev.filter((id) => id !== event.nodeId));
        }
      }
      alert("Workflow executed successfully!");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Factory Workflow Builder
        </h1>
        <button
          onClick={handleExecuteWorkflow}
          disabled={isExecuting}
          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 font-medium"
        >
          {isExecuting ? "Executing..." : "Execute Workflow"}
        </button>
      </div>
      <div className="relative w-full h-[600px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Workflow Editor Canvas */}
        <WorkflowCanvas executingNodeIds={executingNodeIds} />
      </div>
      {workflowResult && (
        <div className="mt-4 p-4 w-full max-w-4xl bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg shadow-md">
          <h3 className="font-bold">Workflow Result:</h3>
          <p className="whitespace-pre-wrap">{workflowResult}</p>
        </div>
      )}
      <PromptInput />
    </div>
  );
}
