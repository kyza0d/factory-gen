"use client";

"use client";

import { PromptInput } from "../components/PromptInput";
import { WorkflowCanvas } from "../components/WorkflowCanvas";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { ExecutionEvent } from "../convex/ai"; // Import ExecutionEvent
import { NodeExecutionStatus } from "../convex/schema/nodes";
import { Group, Select, Divider, Tooltip, Badge, Input } from "ui-lab-components";
import { FaPlay, FaSpinner, FaStop, FaTerminal, FaGear, FaCheck } from "react-icons/fa6";

export default function Home() {
  const executeWorkflow = useAction(api.ai.executeWorkflow);
  const [isExecuting, setIsExecuting] = useState(false); // Used for node-level visualization
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeExecutionStatus>>({});
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);
  const [nodeResults, setNodeResults] = useState<Record<string, unknown>>({});

  // New state for workflow details and actions
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [isEditingName, setIsEditingName] = useState(false);
  const [mode, setMode] = useState<string | null>("run"); // e.g., "run", "schedule", "debug", "dry-run"
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false); // Overall workflow running state

  const handleExecuteWorkflow = async () => {
    setIsWorkflowRunning(true);
    setIsExecuting(true);
    setWorkflowResult(null); // Clear previous results
    setNodeStatuses({}); // Clear previous node statuses
    setNodeResults({}); // Clear previous node results

    try {
      const result = await executeWorkflow({ workflowId: "default" });
      const { events, finalOutput } = result as { events: ExecutionEvent[], finalOutput: string };

      for (const event of events) {
        setNodeStatuses((prev) => ({ ...prev, [event.nodeId]: event.executionStatus }));
        if (event.status === "completed" || event.status === "failed") {
          if (event.output !== undefined) {
            setNodeResults((prev) => ({ ...prev, [event.nodeId]: event.output }));
          }
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay for visual feedback
        }
      }
      setWorkflowResult(finalOutput);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      alert(`Failed to execute workflow: ${(error as Error).message}`);
    } finally {
      setIsExecuting(false);
      setIsWorkflowRunning(false); // Reset overall running state
    }
  };

  const handleStopWorkflow = () => {
    // In a real application, you might send a signal to stop the Convex workflow
    console.log("Workflow stopped by user.");
    setIsWorkflowRunning(false);
    setIsExecuting(false); // Stop node-level visualization
  };

  const handleModeChange = (key: string | number | null) => {
    setMode(key as string);
    // Potentially reset workflow state or configuration based on the new mode
    console.log(`Workflow mode changed to: ${key}`);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <div className="absolute py-1 px-1 top-4 inset-x-0 mx-auto z-10 w-fit bg-background-900 border border-background-700 rounded-full flex items-center gap-2">
        {/* Workflow Name and Edit */}
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
              className="rounded-md bg-background-800 border-none focus:ring-2 focus:ring-accent-500"
              aria-label="Workflow Name"
            />
          ) : (
            <span
              className="cursor-pointer text-text-200 hover:text-text-100 text-xs font-medium px-2 py-1 rounded-md"
              onClick={() => setIsEditingName(true)}
            >
              {workflowName}
            </span>
          )}
        </div>

        {/* Simplified Status Badge */}
        {!isWorkflowRunning && workflowResult && (
          <Badge className="bg-success-500/20 text-success-500" size="sm" pill icon={<FaCheck size={12} />}>
            Success
          </Badge>
        )}
        {!isWorkflowRunning && workflowResult === null && !isExecuting && (
          <Badge size="sm" pill>
            Idle
          </Badge>
        )}
        <Divider className="-my-1" orientation="vertical" />
        {/* Workflow Action Group (Run, Schedule, Debug, Dry Run) */}
        <Group orientation="horizontal" spacing="none" className="shrink-0 rounded-full">
          <Group.Select className="" selectedKey={mode} onSelectionChange={handleModeChange} isDisabled={isWorkflowRunning}>
            <Group.Button
              onPress={handleExecuteWorkflow}
              isDisabled={isWorkflowRunning}
              size="sm"
              icon={{ left: isWorkflowRunning ? <FaSpinner className="animate-spin" size={12} /> : <FaPlay /> }}
              className="pl-4 w-42 justify-start"
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


        {/* Control Buttons (Stop, Logs, Settings) */}
        <Group className="rounded-full" spacing="none">
          <Tooltip content="Stop">
            <Group.Button className="p-3" onPress={handleStopWorkflow} isDisabled={!isWorkflowRunning}>
              <FaStop size={14} />
            </Group.Button>
          </Tooltip>
          {/* Logs and Settings buttons are placeholders for now */}
          <Tooltip content="View logs">
            <Group.Button className="p-3" isDisabled={isWorkflowRunning}>
              <FaTerminal size={14} />
            </Group.Button>
          </Tooltip>
          <Tooltip content="Settings">
            <Group.Button className="p-3" isDisabled={isWorkflowRunning}>
              <FaGear size={14} />
            </Group.Button>
          </Tooltip>
        </Group>

      </div>

      <main className="grid-paper isolate flex-1 relative overflow-hidden">
        <WorkflowCanvas nodeStatuses={nodeStatuses} nodeResults={nodeResults} />
      </main>

      <PromptInput />
    </div>
  );
}
