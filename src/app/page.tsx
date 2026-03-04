"use client";

import Link from "next/link";
import { Button } from "ui-lab-components";
import { FaRoute, FaPlus } from "react-icons/fa6";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api"
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
      Factory Gen Dashboard
    </div>
  );
}
