"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { UINode, WorkflowGraph } from "../convex/schema/nodes";
import { Button, Input } from "ui-lab-components";

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
    <div className="flex flex-col space-y-2 w-140">
      <div className="flex space-x-2">
        {/* Unified Generation Control */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2">
          <Input
            type="text"
            variant="ghost"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe Module or Workflow..."
            className="rounded-full  font-medium flex-grow p-2 px-4"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="rounded-full px-4 py-2"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Send"}
          </Button>
        </form>
      </div>
      {isLoading && (
        <div className="flex items-center">
          <div className="h-3 w-3 mr-2"></div>
          <span>Processing_AI_Task...</span>
        </div>
      )}
    </div>
  );
}

