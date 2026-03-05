"use client"
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FaRoute, FaPlus } from 'react-icons/fa6';
import { Expand, Button } from 'ui-lab-components';
import { useQuery, useMutation } from 'convex/react';
import { api } from "../../../../convex/_generated/api"
import { useSidebar, useApp } from '../app-context';
import { useAppNavigation } from '../app-navigation';

export const WorkflowsSection = React.memo(function WorkflowsSection() {
  const { isCollapsed } = useSidebar();
  const { activeSection } = useApp();
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

  const handleCreateWorkflow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const id = await createEmptyWorkflow({ name: "Untitled Workflow" });
      navigateToWorkflow(id);
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  }, [createEmptyWorkflow, navigateToWorkflow]);

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
                w-full flex items-center h-10 gap-4 px-3 rounded-sm transition-all duration-200 group
                ${isWorkflowsActive
                ? 'bg-background-900 text-foreground-100'
                : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
              `}
            title={isCollapsed ? "Workflows" : undefined}
            onClick={handleWorkflowsClick}
          >
            <FaRoute size={17} className="shrink-0 transition-transform duration-200" />
            {!isCollapsed && (
              <span className="flex font-medium text-xs whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
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
          <div className="flex flex-col gap-0.5 pl-3 pr-2 mt-1">
            <WorkflowsList />
          </div>
        </Expand.Content>
      </Expand>
    </div>
  );
});

const WorkflowNavItem = React.memo(function WorkflowNavItem({ 
  id, 
  name,
}: { 
  id: string; 
  name: string; 
}) {
  const { activeWorkflowId } = useApp();
  const { navigateToWorkflow } = useAppNavigation();
  const isActive = activeWorkflowId === id;
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigateToWorkflow(id);
  }, [id, navigateToWorkflow]);

  return (
    <Link
      href={`/workflows/${id}`}
      onClick={handleClick}
      className={`
        py-2 px-2 text-xs rounded-sm transition-colors block
        ${isActive
          ? 'text-foreground-100 bg-background-800'
          : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
      `}
    >
      {name}
    </Link>
  );
});

const WorkflowsList = React.memo(function WorkflowsList() {
  const workflows = useQuery(api.nodes.getWorkflowsWithStatus);

  if (workflows === undefined) {
    return <div className="p-2 text-xs text-foreground-500">Loading...</div>;
  }

  if (workflows.length === 0) {
    return <div className="p-2 text-xs text-foreground-500 italic">No workflows</div>;
  }

  return (
    <>
      {workflows.map((workflow) => (
        <WorkflowNavItem
          key={workflow.id}
          id={workflow.id}
          name={workflow.name}
        />
      ))}
    </>
  );
});
