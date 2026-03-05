"use client"
import React, { useMemo, useCallback } from 'react';
import {
  FaUser,
  FaGear,
  FaRightFromBracket,
  FaCircleQuestion,
  FaShapes,
  FaBook,
  FaChevronLeft
} from 'react-icons/fa6';
import { Divider, List } from 'ui-lab-components';
import { PanelLeft } from 'lucide-react';

import { NavItem } from './nav-item';
import { WorkflowsSection } from './workflows-section';
import Logo from '../logo';
import { useSidebar } from '../app-context';
import { useAppNavigation } from '../app-navigation';
import { FaChevronCircleLeft } from 'react-icons/fa';

const MAIN_NAV_ITEMS = [
  { id: 'nodes', label: 'Nodes', icon: FaShapes },
  { id: 'sources', label: 'Sources', icon: FaBook },
  { id: 'agents', label: 'Agents', icon: FaUser },
];

const SECONDARY_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', icon: FaGear, href: '/settings' },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'help', label: 'Help & Support', icon: FaCircleQuestion, href: '/help' },
];

export const SidebarContent = React.memo(function SidebarContent() {
  const { isCollapsed, activeItem, toggleSidebar, setActiveItem, handleBack } = useSidebar();
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
            <NavItem item={{ id: 'node1', label: 'Node 1 (Input)', icon: FaShapes, href: '/nodes/node1' }} />
            <NavItem item={{ id: 'node2', label: 'Node 2 (AI)', icon: FaShapes, href: '/nodes/node2' }} />
            <NavItem item={{ id: 'node3', label: 'Node 3 (Output)', icon: FaShapes, href: '/nodes/node3' }} />
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

  const handleToggle = useCallback(() => toggleSidebar(), [toggleSidebar]);
  const handleBackClick = useCallback(() => handleBack(), [handleBack]);

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-background-950 border-r border-background-700
        flex text-xs flex-col transition-all duration-300 ease-in-out
        h-screen sticky top-0
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pt-2 px-2 shrink-0">
        {!isCollapsed && (
          <button
            onClick={() => navigateToDashboard()}
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap animate-in fade-in duration-300 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 text-accent-500 bg-accent-500/20 flex items-center justify-center shrink-0 rounded-sm">
              <Logo className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              <span className='text-xs font-bold -mb-1 text-foreground-50'>Factory</span>
              <span className='text-[10px] tracking-wider font-black text-accent-500'>GEN</span>
            </div>
          </button>
        )}

        <button
          onClick={handleToggle}
          className={`
            p-2.5 rounded-sm text-foreground-400 hover:bg-background-900 hover:text-foreground-50
            focus:outline-none focus:ring-2 focus:ring-accent-500/30
            ${isCollapsed ? 'mx-auto' : ''}
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={19} />
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
              <FaChevronLeft size={15} />
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
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              currentActiveId={activeItem}
            />
          ))}
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

          <button
            className="w-full flex items-center gap-4 px-3 py-2.5 text-foreground-400 hover:text-red-400 hover:bg-red-500/5 rounded-sm transition-all duration-200 group"
            title={isCollapsed ? "Logout" : undefined}
          >
            <FaRightFromBracket size={17} className="shrink-0 transition-colors" />
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
});
