"use client"
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment, usePathname } from 'next/navigation';
import { FaRoute, FaPlus } from 'react-icons/fa6';
import { Expand, Group, Button } from 'ui-lab-components';

interface WorkflowsSectionProps {
  isCollapsed: boolean;
}

export const WorkflowsSection = React.memo(function WorkflowsSection({ isCollapsed }: WorkflowsSectionProps) {
  const segment = useSelectedLayoutSegment();
  const isWorkflowsActive = segment === 'workflows';
  const pathname = usePathname();

  // Expansion state: defaults to true if workflows segment is active, but can be toggled
  const [isManualExpanded, setIsManualExpanded] = useState<boolean | null>(null);
  const isExpanded = isManualExpanded ?? isWorkflowsActive;

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    // We let the Link navigate if it's a new navigation, but we toggle the expansion manually if needed
    setIsManualExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <div className="w-full flex items-center mb-2">
      <Expand
        className='flex-grow'
        isExpanded={isExpanded && !isCollapsed}
        onExpandedChange={setIsManualExpanded}
      >
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
          {!isCollapsed && (
            <div className='ml-auto flex'>
              <Button
                variant='ghost'
                title="Create new workflow"
                className="w-7 h-7 p-0 mr-1 rounded-sm text-foreground-400 hover:text-foreground-50 hover:bg-background-700"
              >
                <FaPlus size={13} />
              </Button>
              <Expand.Icon className='w-7 h-7 p-0  hover:text-foreground-50 hover:bg-background-700' />
            </div>
          )}
        </Link>
        <Expand.Content>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5 pl-3 pr-2 mt-1">
              {[
                { id: 'my-workflows', label: 'Untitled Workflow', href: '/workflows' },
              ].map((workflow) => {
                const isSubActive = pathname === workflow.href;
                return (
                  <Link
                    key={workflow.id}
                    href={workflow.href}
                    className={`
                      py-2 px-2 text-xs rounded-sm transition-colors block
                      ${isSubActive
                        ? 'text-foreground-100 bg-background-800'
                        : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
                    `}
                  >
                    {workflow.label}
                  </Link>
                );
              })}
            </div>
          )}
        </Expand.Content>
      </Expand>
    </div>
  );
});
