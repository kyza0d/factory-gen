"use client"
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment, usePathname, useRouter } from 'next/navigation';
import { FaRoute, FaPlus } from 'react-icons/fa6';
import { Expand, Button } from 'ui-lab-components';
import { useQuery, useMutation } from 'convex/react';
import { api } from "../../../../convex/_generated/api"

interface WorkflowsSectionProps {
  isCollapsed: boolean;
}

export const WorkflowsSection = React.memo(function WorkflowsSection({ isCollapsed }: WorkflowsSectionProps) {
  const segment = useSelectedLayoutSegment();
  const isWorkflowsActive = segment === 'workflows';
  const pathname = usePathname();
  const router = useRouter();

  const workflows = useQuery(api.nodes.getWorkflows);
  const createEmptyWorkflow = useMutation(api.nodes.createEmptyWorkflow);

  const [isManualExpanded, setIsManualExpanded] = useState<boolean | null>(null);
  const isExpanded = isManualExpanded ?? isWorkflowsActive;

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    setIsManualExpanded(!isExpanded);
  }, [isExpanded]);

  const handleCreateWorkflow = useCallback(async () => {

    try {
      const id = await createEmptyWorkflow({ name: "Untitled Workflow" });
      router.push(`/workflows/${id}`);
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  }, [createEmptyWorkflow, router]);

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
            onClick={toggleExpand}
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
              <Expand.Icon className='w-7 h-7 p-0  hover:text-foreground-50 hover:bg-background-700' />
            </div>
          )}
        </div>
        <Expand.Content>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5 pl-3 pr-2 mt-1">
              {workflows?.map((workflow) => {
                const href = `/workflows/${workflow.id}`;
                const isSubActive = pathname === href;
                return (
                  <Link
                    key={workflow.id}
                    href={href}
                    className={`
                      py-2 px-2 text-xs rounded-sm transition-colors block
                      ${isSubActive
                        ? 'text-foreground-100 bg-background-800'
                        : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
                    `}
                  >
                    {workflow.name}
                  </Link>
                );
              })}
              {workflows === undefined && <div className="p-2 text-xs text-foreground-500">Loading...</div>}
              {workflows?.length === 0 && <div className="p-2 text-xs text-foreground-500 italic">No workflows</div>}
            </div>
          )}
        </Expand.Content>
      </Expand>
    </div>
  );
});
