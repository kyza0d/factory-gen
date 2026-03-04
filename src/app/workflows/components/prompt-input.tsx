"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Button, Input } from "ui-lab-components";
import { FaPencil } from "react-icons/fa6";
import { api } from "../../../../convex/_generated/api";
import { UINode, WorkflowGraph } from "../../../../convex/schema/nodes";

interface PromptInputProps {
  workflowId: string;
}

export function PromptInput({ workflowId }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateNode = useAction(api.ai.generateNode);
  const createNode = useMutation(api.nodes.createNode);

  const generateWorkflow = useAction(api.ai.generateWorkflow);
  const createWorkflow = useMutation(api.nodes.createWorkflow);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !workflowId) return;

    setIsLoading(true);
    try {
      if (
        prompt.toLowerCase().includes("workflow") ||
        prompt.toLowerCase().includes("process") ||
        prompt.toLowerCase().includes("graph") ||
        prompt.toLowerCase().includes("sequence") ||
        prompt.toLowerCase().includes("pipeline")
      ) {
        const workflow: WorkflowGraph = await generateWorkflow({ prompt, workflowId });
        await createWorkflow({ workflow: { ...workflow, id: workflowId } });
      } else {
        const generatedNode = (await generateNode({ prompt, workflowId })) as UINode;
        await createNode({ ...generatedNode, workflowId });
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
          <div className="absolute w-120 h-14 flex bottom-4 right-0 left-0 mx-auto z-10 bg-background-900 border border-background-700 rounded-full  font-medium">
            <Input
              type="text"
              variant="ghost"
              value={prompt}
              prefixIcon={<FaPencil className="ml-2" />}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe Module or Workflow..."
              className="absolute w-120 pl-12 pr-24 h-14 rounded-full"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="secondary"
              className="rounded-full z-20 px-6 py-1 my-1 mr-1"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Send"}
            </Button>
          </div>
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

