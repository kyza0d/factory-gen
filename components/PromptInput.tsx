"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UINode, WorkflowGraph } from "../convex/schema/nodes";

export function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const generateNode = useAction(api.ai.generateNode);
  const createNode = useMutation(api.nodes.createNode);
  
  const generateWorkflow = useAction(api.ai.generateWorkflow);
  const createWorkflow = useMutation(api.nodes.createWorkflow);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      if (prompt.toLowerCase().includes("workflow") || 
          prompt.toLowerCase().includes("process") ||
          prompt.toLowerCase().includes("graph") ||
          prompt.toLowerCase().includes("sequence") ||
          prompt.toLowerCase().includes("pipeline")) {
        const workflow: WorkflowGraph = (await generateWorkflow({ prompt }));
        // For the sandbox, we'll use 'default' as the workflowId so it shows up on the canvas
        const sandboxWorkflow: WorkflowGraph = {
          ...workflow,
          id: "default",
          nodes: workflow.nodes.map((n) => ({ ...n, workflowId: "default" })),
          edges: workflow.edges.map((e) => ({ ...e, workflowId: "default" })),
        };
        await createWorkflow({ workflow: sandboxWorkflow });
      } else {
        const generatedNode = (await generateNode({ prompt })) as UINode;
        await createNode({ ...generatedNode, workflowId: "default" });
      }
      setPrompt("");
    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Failed to generate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col space-y-4 border border-gray-200 dark:border-gray-700">
      <div className="flex space-x-4">
        {/* Unified Generation Control */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a node or a workflow to generate..."
            className="flex-grow p-2 pl-4 bg-gray-50 dark:bg-gray-700 rounded-full focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 border border-transparent focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            disabled={isLoading}
          >
            Generate
          </button>
        </form>
      </div>
      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
          <span className="text-xs text-gray-500">Processing AI magic...</span>
        </div>
      )}
    </div>
  );
}

