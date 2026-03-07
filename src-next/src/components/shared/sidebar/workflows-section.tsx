"use client"
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FaRoute, FaPlus } from 'react-icons/fa6';
import { Expand, Button, Select, Menu, Scroll, Input } from 'ui-lab-components';
import { useQuery, useMutation } from 'convex/react';
import { api } from "@convex/_generated/api"
import { useApp } from '../app-context';
import { useSidebar } from './sidebar-context';
import { useAppNavigation } from '../app-navigation';
import { HiMiniEllipsisVertical } from 'react-icons/hi2';

export const WorkflowsSection = React.memo(function WorkflowsSection() {
  const { isCollapsed } = useSidebar();
  const { activeSection, activeWorkspaceId } = useApp();
  const { navigateToWorkflows, navigateToWorkflow } = useAppNavigation();
  const isWorkflowsActive = activeSection === 'workflows';

  const createEmptyWorkflow = useMutation(api.nodes.createEmptyWorkflow);

  const [isManualExpanded, setIsManualExpanded] = useState<boolean | null>(null);
  const isExpanded = isManualExpanded ?? isWorkflowsActive;

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsManualExpanded(!isExpanded);
  }, [isExpanded]);

  const handleWorkflowsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigateToWorkflows();
    setIsManualExpanded(true);
  }, [navigateToWorkflows]);

  const handleCreateWorkflow = useCallback(async () => {
    try {
      const id = await createEmptyWorkflow({
        name: "Untitled Workflow",
        workspaceId: activeWorkspaceId ?? undefined,
      });
      navigateToWorkflow(id);
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  }, [createEmptyWorkflow, navigateToWorkflow, activeWorkspaceId]);

  return (
    <div className="w-full flex items-center mb-2">
      <Expand
        className='flex-grow'
        isExpanded={isExpanded && !isCollapsed}
        onExpandedChange={setIsManualExpanded}
      >
        <div className='w-full relative'>
          <Link
            href="/workflows"
            className={`
                w-full text-nowrap flex items-center h-10 gap-4 px-3 rounded-sm group
                ${isWorkflowsActive
                ? 'bg-background-900 text-foreground-100'
                : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
              `}
            title={isCollapsed ? "Workflows" : undefined}
            onClick={handleWorkflowsClick}
          >
            <FaRoute size={17} className="shrink-0" />
            {!isCollapsed && (
              <span className="flex font-medium text-xs whitespace-nowrap overflow-hidden">
                Workflows
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <div className='absolute right-2 top-1.5 flex z-10'>
              <Button
                variant='ghost'
                title="Create new workflow"
                onClick={handleCreateWorkflow}
                className="w-7 h-7 p-0 mr-1 rounded-sm text-foreground-400 hover:text-foreground-50 hover:bg-background-700"
              >
                <FaPlus size={13} />
              </Button>
              <Expand.Icon
                onClick={toggleExpand}
                className='w-7 h-7 p-0  hover:text-foreground-50 hover:bg-background-700'
              />
            </div>
          )}
        </div>
        <Expand.Content>
          <Scroll fadeY maxHeight='300px' className='mt-2 overflow-y-auto'>
            <WorkflowsList />
          </Scroll>
        </Expand.Content>
      </Expand>
    </div>
  );
});

const WorkflowNavItem = React.memo(function WorkflowNavItem({ id, name }: { id: string; name: string; }) {
  const { activeWorkflowId } = useApp();
  const { navigateToWorkflow, navigateToWorkflows } = useAppNavigation();
  const isActive = activeWorkflowId === id;

  const renameWorkflowMutation = useMutation(api.nodes.renameWorkflow);
  const deleteWorkflowMutation = useMutation(api.nodes.deleteWorkflow);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigateToWorkflow(id);
  }, [id, navigateToWorkflow]);

  const handleRenameStart = useCallback(() => {
    setIsRenaming(true);
    setRenameValue(name);
  }, [name]);

  const handleRenameConfirm = useCallback(async () => {
    if (renameValue.trim() && renameValue !== name) {
      try {
        await renameWorkflowMutation({ id, name: renameValue.trim() });
      } catch (error) {
        console.error("Failed to rename workflow:", error);
        setRenameValue(name);
      }
    }
    setIsRenaming(false);
  }, [renameValue, name, id, renameWorkflowMutation]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRenameConfirm();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  }, [handleRenameConfirm]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteWorkflowMutation({ id });
      // If deleting the active workflow, navigate away
      if (isActive) {
        navigateToWorkflows();
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  }, [id, isActive, deleteWorkflowMutation, navigateToWorkflows]);

  return (
    <div className='relative group cursor-pointer'>
      {isRenaming ? (
        <Input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameConfirm}
          className="text-xs font-medium px-2 py-2 bg-background-800 border-none focus:ring-2 focus:ring-accent-500 rounded-sm"
          aria-label="Workflow Name"
        />
      ) : (
        <Link
          href={`/workflows/${id}`}
          onClick={handleClick}
          className={`
py-2 px-2 text-xs font-medium rounded-sm block
${isActive
              ? 'text-foreground-100 bg-background-800'
              : 'text-foreground-400 group-hover:text-foreground-50 group-hover:bg-background-900'}
`}
        >
          {name}
        </Link>
      )}
      {!isRenaming && (
        <Menu type="pop-over">
          <Menu.Trigger className='p-1.5 absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 rounded-xs hover:bg-background-700'>
            <HiMiniEllipsisVertical />
          </Menu.Trigger>
          <Menu.Content offset={4} side="right">
            <Menu.Item onSelect={handleRenameStart}>Rename</Menu.Item>
            <Menu.Item onSelect={handleDelete}>Delete</Menu.Item>
          </Menu.Content>
        </Menu>
      )}
    </div>
  );
});

const WorkflowsList = React.memo(function WorkflowsList() {
  const { activeWorkspaceId } = useApp();
  const workflows = useQuery(
    api.workspaces.getWorkflowsByWorkspace,
    activeWorkspaceId !== null ? { workspaceId: activeWorkspaceId } : "skip",
  );

  if (workflows === undefined) {
    return <div className="p-2 text-xs text-foreground-500">Loading...</div>;
  }

  if (workflows.length === 0) {
    return <div className="p-2 text-xs text-foreground-500 italic">No workflows</div>;
  }

  return (
    <>
      {workflows.map((workflow: { id: string; name: string }) => (
        <WorkflowNavItem
          key={workflow.id}
          id={workflow.id}
          name={workflow.name}
        />
      ))}
    </>
  );
});
