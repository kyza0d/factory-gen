"use client"
import React, { useMemo, useCallback, useRef } from 'react';
import {
  FaUser,
  FaGear,
  FaShapes,
  FaBook,
  FaChevronLeft,
  FaMagnifyingGlass,
  FaCircleQuestion,
  FaRegCircleQuestion,
} from 'react-icons/fa6';
import { Divider, Input, List, Menu, Button } from 'ui-lab-components';
import { useMutation } from 'convex/react';
import { api } from "@convex/_generated/api";
import { HiMiniEllipsisVertical } from 'react-icons/hi2';
import { SiGitbook } from "react-icons/si";

import { NavItem } from './nav-item';
import { WorkflowsSection } from './workflows-section';
import { WorkspaceSwitcher } from './workspace-switcher';
import { useSidebar } from './sidebar-context';
import { NodeMetadataRegistry } from '@registry/nodes';
import { NodePalette } from '@/app/workflows/components/node-palette';
import { useApp } from '../app-context';

const MAIN_NAV_ITEMS = [
  { id: 'nodes', label: 'Nodes', icon: FaShapes },
  { id: 'sources', label: 'Sources', icon: FaBook },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', icon: FaGear, href: '/settings' },
];

function NodeInserterSection({ query }: { query?: string }) {
  const { activeWorkflowId } = useApp();
  const createNode = useMutation(api.nodes.createNode);
  const nodeCounterRef = useRef(0);

  const handleAddNode = useCallback(async (type: string) => {
    if (!activeWorkflowId) return;
    const meta = NodeMetadataRegistry[type];
    if (!meta) return;
    const count = nodeCounterRef.current++;
    const id = crypto.randomUUID();
    await createNode({
      id,
      type: meta.type,
      label: meta.label,
      inputs: (meta.inputs ?? []) as any[],
      outputs: (meta.outputs ?? []) as any[],
      parameters: (meta.parameters ?? []).map(p => ({ ...p, enabled: true })) as any[],
      modules: meta.modules
        ? meta.modules.map(m => ({
          id: crypto.randomUUID(),
          type: m.type,
          label: m.label,
          value: m.value ?? null,
          enabled: m.enabled ?? true
        }))
        : null,
      workflowId: activeWorkflowId,
      position: { x: 100 + (count % 10) * 50, y: 100 + (count % 10) * 50 },
    });
  }, [activeWorkflowId, createNode]);

  if (!activeWorkflowId) {
    return <p className="text-xs text-foreground-500 px-3 py-2 italic">Open a workflow to add nodes</p>;
  }

  return <NodePalette onAddNode={handleAddNode} query={query} />;
}

export const SidebarContent = React.memo(function SidebarContent() {
  const { isCollapsed, activeItem, setActiveItem, handleBack } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const displayedHeader = useMemo(() => {
    if (activeItem) {
      const item = MAIN_NAV_ITEMS.find(navItem => navItem.id === activeItem);
      return item ? item.label : 'Back';
    }
    return null;
  }, [activeItem]);

  const renderContent = (query?: string) => {
    if (query) {
      return <NodeInserterSection query={query} />;
    }
    if (!activeItem) return null;
    switch (activeItem) {
      case 'nodes':
        return <NodeInserterSection />;
      case 'sources':
        return (
          <List aria-label="Sources list" className="w-full m-0 space-y-2">
            <NavItem
              item={{ id: 'source1', label: 'Source A', icon: FaBook, href: '/sources/source1' }}
            />
            <NavItem
              item={{ id: 'source2', label: 'Source B', icon: FaBook, href: '/sources/source2' }}
            />
          </List>
        );
      case 'agents':
        return (
          <List aria-label="Agents list" className="w-full m-0 space-y-2">
            <NavItem
              item={{ id: 'agent1', label: 'Agent X', icon: FaUser, href: '/agents/agent1' }}
            />
            <NavItem
              item={{ id: 'agent2', label: 'Agent Y', icon: FaUser, href: '/agents/agent2' }}
            />
          </List>
        );
      default:
        return null;
    }
  };

  const handleBackClick = useCallback(() => handleBack(), [handleBack]);

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-background-950 border-r border-background-700
        flex text-xs flex-col transition-all duration-300 ease-in-out
        h-full
      `}
    >
      {/* Sidebar Header */}
      <div className="flex border-b border-background-700 items-center justify-between py-2 px-1 shrink-0">
        <WorkspaceSwitcher isSearchOpen={isSearchOpen} toggleSearch={toggleSearch} />
      </div>

      {!isCollapsed && (
        <div className="flex flex-col items-between justify-center h-12 px-1 border-b border-background-700 shrink-0">
          <div className="flex items-center">
            <button
              onClick={toggleSearch}
              className="w-8 h-8 aspect-square flex mr-1 items-center justify-center rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
              aria-label="Search"
            >
              <FaMagnifyingGlass size={13} />
            </button>
            {!isSearchOpen && (
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
              >
                <SiGitbook size={16} />
              </button>
            )}
            {isSearchOpen ? (
              <Input
                className='rounded-xs py-1.5'
                type="text"
                placeholder={activeItem ? `Search ${MAIN_NAV_ITEMS.find(i => i.id === activeItem)?.label ?? 'Items'}...` : 'Search Library...'}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                autoFocus
              />
            ) : ( // !isSearchOpen
              <div className='flex items-center justify-between grow'>
                {activeItem ?
                  <span className="text-xs font-medium text-foreground-300">{displayedHeader}</span> : <div className='py-1'></div>
                }
                <div className='flex'>
                  {activeItem && (
                    <button
                      onClick={handleBackClick}
                      className="w-8 h-8 flex items-center justify-center rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                      aria-label="Back"
                    >
                      <FaChevronLeft size={11} />
                    </button>
                  )}
                  <Menu type="pop-over">
                    <Menu.Trigger
                      className={`w-8 h-8 flex items-center justify-center rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-accent-500/30 ${(activeItem === 'nodes' || !activeItem) ? '' : 'invisible'
                        }`}
                    >
                      <HiMiniEllipsisVertical size={16} />
                    </Menu.Trigger>
                    <Menu.Content offset={4} side="right">
                      <Menu.Item onSelect={() => console.log("List View Selected")}>
                        List View
                      </Menu.Item>
                      <Menu.Item onSelect={() => console.log("Grid View Selected")}>
                        Grid View
                      </Menu.Item>
                    </Menu.Content>
                  </Menu>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="p-2 flex flex-col items-start overflow-y-auto overflow-x-hidden custom-scrollbar">
        {searchQuery ? (
          renderContent(searchQuery)
        ) : activeItem ? (
          renderContent()
        ) : (
          <List aria-label="Main navigation" className="m-0 space-y-2 w-full">
            {MAIN_NAV_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                onSelect={setActiveItem}
                currentActiveId={activeItem}
              />
            ))}
          </List>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-auto shrink-0 space-y-1 bg-background-950 z-10">
        <List aria-label="Secondary navigation" className="mx-2 space-y-1">
          <WorkflowsSection />
        </List>
        <Divider />

        <div className='px-2 pb-2'>
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              currentActiveId={activeItem}
            />
          ))}
        </div>
      </div>
    </aside>
  );
});
