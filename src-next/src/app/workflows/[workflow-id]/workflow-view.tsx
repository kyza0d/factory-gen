"use client";

import { PromptInput } from "../components/prompt-input";
import { GenerationProgress } from "../components/generation-progress";
import { DebugPanel } from "../components/debug-panel";
import { WorkflowCanvas } from "../components/workflow-canvas";
import { useAction, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { Group, Select, Divider, Tooltip, Badge, Input, Button } from "ui-lab-components";
import { FaPlay, FaSpinner, FaStop, FaTerminal, FaGear, FaCheck, FaWrench, FaToolbox, FaScrewdriverWrench } from "react-icons/fa6";
import { useParams } from "next/navigation";
import { api } from "@convex/_generated/api";
import { NodeExecutionStatus } from "@registry/types";
import { ExecutionEvent } from "@convex/workflow_actions";
import { useSidebar } from "@/components/shared/sidebar/sidebar-context";
import { useApp } from "@/components/shared/app-context";
import { PanelLeft } from "lucide-react";

export function WorkflowView() {
  const params = useParams();
  const workflowId = params["workflow-id"] as string;
  const { toggleSidebar, isCollapsed } = useSidebar();
  const { setActiveWorkflowId } = useApp();

  const workflow = useQuery(api.nodes.getWorkflow, { workflowId });

  const executeWorkflow = useAction(api.workflow_actions.executeWorkflow);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeExecutionStatus>>({});
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);
  const [nodeResults, setNodeResults] = useState<Record<string, unknown>>({});

  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [isEditingName, setIsEditingName] = useState(false);
  const [mode, setMode] = useState<string | null>("run");
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  useEffect(() => {
    setActiveWorkflowId(workflowId);
    return () => setActiveWorkflowId(null);
  }, [workflowId, setActiveWorkflowId]);

  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
    }
  }, [workflow]);

  const handleExecuteWorkflow = async () => {
    setIsWorkflowRunning(true);
    setIsExecuting(true);
    setWorkflowResult(null);
    setNodeStatuses({});
    setNodeResults({});

    try {
      const result = await executeWorkflow({ workflowId });
      const { events, finalOutput } = result as { events: ExecutionEvent[], finalOutput: string };

      for (const event of events) {
        setNodeStatuses((prev) => ({ ...prev, [event.nodeId]: event.executionStatus }));
        if (event.status === "completed" || event.status === "failed") {
          if (event.output !== undefined) {
            setNodeResults((prev) => ({ ...prev, [event.nodeId]: event.output }));
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      setWorkflowResult(finalOutput);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      alert(`Failed to execute workflow: ${(error as Error).message}`);
    } finally {
      setIsExecuting(false);
      setIsWorkflowRunning(false);
    }
  };

  const handleStopWorkflow = () => {
    setIsWorkflowRunning(false);
    setIsExecuting(false);
  };

  const handleModeChange = (key: string | number | null) => {
    setMode(key as string);
  };

  return (
    <div className="flex px-2 pb-2 flex-col flex-1 h-full min-h-0">
      <div className="mx-2 my-1 inset-x-0 z-10 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={19} />
          </button>
          <div className="flex">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingName(false);
                    }
                  }}
                  className="text-xs font-medium px-2 bg-background-800 border-none focus:ring-2 focus:ring-accent-500"
                  aria-label="Workflow Name"
                />
              ) : (
                <span
                  className="cursor-pointer text-text-200 hover:text-text-100 text-xs font-medium px-2 py-1"
                  onClick={() => setIsEditingName(true)}
                >
                  {workflowName}
                </span>
              )}
            </div>
          </div>
          <div>
            {!isWorkflowRunning && workflowResult && (
              <Badge size="sm" className="bg-success-500/20 text-success-500" pill icon={<FaCheck size={12} />}>
                Success
              </Badge>
            )}
            {!isWorkflowRunning && workflowResult === null && !isExecuting && (
              <Badge size="sm" pill>
                Idle
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="my-1 space-x-2">
            <Tooltip content="Stop">
              <Button variant="ghost" className="p-2" onPress={handleStopWorkflow} isDisabled={!isWorkflowRunning}>
                <FaStop size={14} />
              </Button>
            </Tooltip>
            <Tooltip content="View logs">
              <Button variant="ghost" className="p-2" isDisabled={isWorkflowRunning}>
                <FaTerminal size={14} />
              </Button>
            </Tooltip>
            <Tooltip content="Debug panel">
              <Button
                variant="ghost"
                className={`p-2 ${isDebugOpen ? "text-accent-400 bg-accent-500/10" : ""}`}
                onPress={() => setIsDebugOpen((v) => !v)}
              >
                <FaScrewdriverWrench size={14} />
              </Button>
            </Tooltip>
          </div>
          <Group orientation="horizontal" spacing="none" className="rounded-sm">
            <Group.Select selectedKey={mode} onSelectionChange={handleModeChange} isDisabled={isWorkflowRunning}>
              <Group.Button
                onPress={handleExecuteWorkflow}
                isDisabled={isWorkflowRunning}
                size="sm"
                icon={{ left: isWorkflowRunning ? <FaSpinner className="animate-spin" size={12} /> : <FaPlay /> }}
                className="pl-2 w-38 justify-start"
              >
                {isWorkflowRunning ? "Running..." : "Run Workflow"}
              </Group.Button>
              <Divider size="sm" />
              <Select.Trigger />
              <Select.Content>
                <Select.List>
                  <Select.Item value="run" textValue="Run Workflow">Run Workflow</Select.Item>
                  <Select.Item value="schedule" textValue="Schedule Run">Schedule Run</Select.Item>
                  <Select.Item value="debug" textValue="Debug Mode">Debug Mode</Select.Item>
                  <Select.Item value="dry-run" textValue="Dry Run">Dry Run</Select.Item>
                </Select.List>
              </Select.Content>
            </Group.Select>
          </Group>

        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-2">
        <main className="grid-paper bg-background-950 isolate border border-background-700 rounded-sm flex-1 relative overflow-hidden">
          <WorkflowCanvas workflowId={workflowId} nodeStatuses={nodeStatuses} nodeResults={nodeResults} />
          <GenerationProgress workflowId={workflowId} />
        </main>

        {isDebugOpen && <DebugPanel workflowId={workflowId} />}
      </div>
      <div className="absolute bottom-4 inset-x-0 mx-auto w-fit z-20">
        <PromptInput workflowId={workflowId} />
      </div>
    </div>
  );
}
