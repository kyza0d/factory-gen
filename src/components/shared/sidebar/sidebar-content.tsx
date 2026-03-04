"use client"
import { useState, useCallback } from 'react';
import {
  FaUser,
  FaGear,
  FaRightFromBracket,
  FaCircleQuestion,
  FaShapes,
  FaBook
} from 'react-icons/fa6';
import { Divider, List } from 'ui-lab-components';
import { PanelLeft } from 'lucide-react';

import { NavItem } from './nav-item';
import { WorkflowsSection } from './workflows-section';
import Logo from '../logo';

const MAIN_NAV_ITEMS = [
  { id: 'nodes', label: 'Nodes', icon: FaShapes, href: '/nodes' },
  { id: 'sources', label: 'Sources', icon: FaBook, href: '/sources' },
  { id: 'agents', label: 'Agents', icon: FaUser, href: '/agents' },
];

const SECONDARY_NAV_ITEMS = [
  { id: 'settings', label: 'Settings', icon: FaGear, href: '/settings' },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'help', label: 'Help & Support', icon: FaCircleQuestion, href: '/help' },
];

export function SidebarContent() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

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
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
            <div className="w-10 h-10 text-accent-500 bg-accent-500/20 flex items-center justify-center shrink-0 rounded-sm">
              <Logo className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className='text-xs font-bold -mb-1 text-foreground-50'>Factory</span>
              <span className='text-[10px] tracking-wider font-black text-accent-500'>GEN</span>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
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

      {/* Navigation Items */}
      <nav className="px-2 flex flex-col items-start overflow-y-auto overflow-x-hidden custom-scrollbar">
        <WorkflowsSection isCollapsed={isCollapsed} />

        <List aria-label="Main navigation" className="m-0 space-y-2">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </List>
      </nav>

      {/* Footer */}
      <div className="mt-auto shrink-0 space-y-1 bg-background-950 z-10">
        <List aria-label="Secondary navigation" className="mx-2 space-y-1">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </List>
        <Divider />

        <div className='px-2 pb-2'>
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
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
}
