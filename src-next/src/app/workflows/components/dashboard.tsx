// src/app/workflows/components/dashboard.tsx
"use client";

import { useQuery } from "convex/react";
import { Badge, Button } from "ui-lab-components";
import { useCallback } from "react";
import { api } from "@convex/_generated/api";
import { useAppNavigation } from "@/components/shared/app-navigation";
import { useApp } from "@/components/shared/app-context";

export function Dashboard() {
  const { activeWorkspaceId } = useApp();
  const workflows = useQuery(
    api.workspaces.getWorkflowsByWorkspace,
    activeWorkspaceId !== null ? { workspaceId: activeWorkspaceId } : "skip",
  );
  const { navigateToWorkflow } = useAppNavigation();

  const handleOpenWorkflow = useCallback((id: string) => {
    navigateToWorkflow(id);
  }, [navigateToWorkflow]);

  if (workflows === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading workflows...</div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No workflows found.</p>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-success-100 text-success-600";
      case "failed":
        return "bg-danger-100 text-danger-600";
      default:
        return "bg-background-600 text-foreground-300";
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto pt-8">
      <div className="space-y-2">
        {workflows.map((workflow) => (
          <div
            key={workflow._id}
            className="flex items-center justify-between gap-4 px-4 py-3 border-b border-background-700 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{workflow.name}</h3>
            </div>
            <Badge
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusColor(
                workflow.status
              )}`}
            >
              {workflow.status || "idle"}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenWorkflow(workflow.id)}
            >
              Open
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
