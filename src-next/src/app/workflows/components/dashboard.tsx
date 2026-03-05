// src/app/workflows/components/dashboard.tsx
"use client";

import { useQuery } from "convex/react";
import { Badge, Button, Card } from "ui-lab-components";
import { useCallback } from "react";
import { api } from "@convex/_generated/api";
import { useAppNavigation } from "@/components/shared/app-navigation";

export function Dashboard() {
  const workflows = useQuery(api.nodes.getWorkflowsWithStatus);
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
    <div className="space-y-6 flex items-center justify-center pt-40 min-h-screen">
      <div className="grid gap-4 max-w-md mx-auto">
        {workflows.map((workflow) => (
          <Card
            key={workflow._id}
            className="bg-transparent flex flex-col justify-between"
          >
            <Card.Header className="pb-0 border-b-0 flex items-start justify-between">
              <h3 className="font-semibold text-sm leading-none tracking-tight">
                {workflow.name}
              </h3>
              <Badge
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                  workflow.status
                )}`}
              >
                {workflow.status || "idle"}
              </Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {workflow.description || "No description provided."}
              </p>
            </Card.Body>
            <Card.Footer className="bg-transparent flex justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenWorkflow(workflow.id)}
              >
                Open
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </div>
  );
}
