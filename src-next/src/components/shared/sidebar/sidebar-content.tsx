"use client"
import React, { useMemo, useCallback } from 'react';
import {
  FaUser,
  FaGear,
  FaShapes,
  FaBook,
  FaChevronLeft,
} from 'react-icons/fa6';
import { Divider, List } from 'ui-lab-components';

import { NavItem } from './nav-item';
import { WorkflowsSection } from './workflows-section';
import Logo from '../logo';
import { useSidebar } from './sidebar-context';
import { useAppNavigation } from '../app-navigation';
import { ALL_NODES_METADATA } from '@registry/nodes';

const MAIN_NAV_ITEMS = [
  { id: 'nodes', label: 'Nodes', icon: FaShapes },
  { id: 'sources', label: 'Sources', icon: FaBook },
  { id: 'agents', label: 'Agents', icon: FaUser },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', icon: FaGear, href: '/settings' },
];

export const SidebarContent = React.memo(function SidebarContent() {
  const { isCollapsed, activeItem, setActiveItem, handleBack } = useSidebar();
  const { navigateToDashboard } = useAppNavigation();

  const displayedHeader = useMemo(() => {
    if (activeItem) {
      const item = MAIN_NAV_ITEMS.find(navItem => navItem.id === activeItem);
      return item ? item.label : 'Back';
    }
    return null;
  }, [activeItem]);

  const renderContent = () => {
    if (!activeItem) return null;
    switch (activeItem) {
      case 'nodes':
        return (
          <List aria-label="Nodes list" className="w-full m-0 space-y-2">
            {ALL_NODES_METADATA.map((node) => (
              <NavItem
                key={node.type}
                item={{
                  id: node.type.toLowerCase(),
                  label: node.label,
                  icon: FaShapes,
                  href: `/nodes/${node.type.toLowerCase()}`,
                }}
              />
            ))}
          </List>
        );
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
      <div className="flex items-center justify-between py-2 px-2 shrink-0">
        <button
          onClick={() => navigateToDashboard()}
          className="ml-2 mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap animate-in fade-in duration-300 hover:opacity-80 transition-opacity"
        >
          <Logo className="w-6 h-6" />
        </button>
      </div>

      <Divider size="sm" />

      {/* New Header for active items */}
      {!isCollapsed && activeItem && (
        <div>
          <div className="flex justify-between border-background-700 items-center gap-2 pb-2 pr-4 pl-3 shrink-0 text-foreground-50 font-bold text-sm">
            <button
              onClick={handleBackClick}
              className={`
p-2 rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50
focus:outline-none focus:ring-2 focus:ring-accent-500/30
`}
              aria-label="Back"
            >
              <FaChevronLeft size={13} />
            </button>
          </div>
          <Divider size="sm" className='mt-0' />
          <div className='pl-6'>
            <span className='text-xs font-semibold'>{displayedHeader}</span>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="px-2 flex flex-col items-start overflow-y-auto overflow-x-hidden custom-scrollbar">
        {activeItem ? (
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
