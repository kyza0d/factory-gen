"use client";

import Link from "next/link";
import { Button } from "ui-lab-components";
import { FaRoute, FaPlus } from "react-icons/fa6";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const createEmptyWorkflow = useMutation(api.nodes.createEmptyWorkflow);
  const router = useRouter();

  const handleCreateWorkflow = async () => {
    try {
      const id = await createEmptyWorkflow({ name: "Untitled Workflow" });
      router.push(`/workflows/${id}`);
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-background-950 text-foreground-50">
      <div className="max-w-md text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 mx-auto bg-accent-500/10 text-accent-500 flex items-center justify-center rounded-2xl">
          <FaRoute size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Factory GEN</h1>
          <p className="text-foreground-400">
            Create and manage complex AI workflows with ease. Select a workflow from the sidebar or create a new one to get started.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button 
            size="lg" 
            variant="primary" 
            className="w-full"
            onClick={handleCreateWorkflow}
            icon={{ left: <FaPlus /> }}
          >
            Create Your First Workflow
          </Button>
          <p className="text-xs text-foreground-500">
            All your workflows are saved automatically in the cloud.
          </p>
        </div>
      </div>
    </div>
  );
}
