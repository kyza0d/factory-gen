"use client"
import { PanelLeft } from 'lucide-react';
import { useState } from 'react';
import {
  FaUser,
  FaGear,
  FaRightFromBracket,
  FaCircleQuestion,
  FaRoute,
  FaShapes,
  FaBook // Added for Sources
} from 'react-icons/fa6';
import { Divider, List, Expand, Group, Button } from 'ui-lab-components'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IconType } from 'react-icons'; // Import IconType for type-safety

interface NavItemType {
  id: string;
  label: string;
  icon: IconType;
}

interface SidebarProps {
  activeItem?: string;
}

export function Sidebar({ activeItem = 'dashboard' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWorkflowsExpanded, setIsWorkflowsExpanded] = useState(false); // State for Workflows Expand

  const mainNavItems: NavItemType[] = [
    // Workflows will be handled by Expand component
    { id: 'nodes', label: 'Nodes', icon: FaShapes },
    { id: 'sources', label: 'Sources', icon: FaBook },
    { id: 'agents', label: 'Agents', icon: FaUser },
  ];

  const secondaryNavItems: NavItemType[] = [
    { id: 'settings', label: 'Settings', icon: FaGear },
  ];

  const bottomNavItems: NavItemType[] = [
    { id: 'help', label: 'Help & Support', icon: FaCircleQuestion },
  ];

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-16' : 'w-53'} 
        bg-background-950 border-r border-background-700 
        flex text-xs flex-col transition-all duration-300 ease-in-out
        h-screen sticky top-0
      `}
    >
      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-2 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
            <div className="w-10 h-10 bg-background-800 flex items-center justify-center shrink-0 rounded-sm">
              <FaRoute size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground-50 leading-none">NodeGraph</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
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

      <Divider />

      {/* Navigation Items */}
      <nav className="px-2 flex flex-col items-start overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Workflows Expand Component */}
        <Expand className='mb-2 ' isExpanded={isWorkflowsExpanded} onExpandedChange={setIsWorkflowsExpanded}>
          <Expand.Trigger>
            <Button
              onClick={() => setIsWorkflowsExpanded(o => !o)}
              variant='ghost' // Assuming a ghost variant for transparent background
              title={isCollapsed ? "Workflows" : undefined}
              className={`
                    w-full flex items-center h-10 gap-4 px-3 rounded-sm transition-all duration-200 group
                    ${activeItem === 'workflows' ? 'bg-background-900 text-foreground-100' : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
                  `}
            >
              <FaRoute size={17} className="shrink-0 transition-transform duration-200" />
              {!isCollapsed && (
                <span className="font-medium text-xs whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                  Workflows
                </span>
              )}
              {!isCollapsed && <Expand.Icon className='ml-auto text-foreground-400 bg-transparent' />}
            </Button>
          </Expand.Trigger>
          <Expand.Content>
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 pl-3 pr-2 mt-1">
                {[
                  { id: 'new-workflow', label: 'New Workflow' },
                  { id: 'my-workflows', label: 'My Workflows' },
                ].map((workflow) => (
                  <a
                    key={workflow.id}
                    href="#"
                    className="py-2 px-2 text-xs text-foreground-400 hover:text-foreground-50 rounded-sm hover:bg-background-900 block transition-colors"
                  >
                    {workflow.label}
                  </a>
                ))}
              </div>
            )}
          </Expand.Content>
        </Expand>

        <List aria-label="Main navigation" className="m-0 space-y-2">
          {mainNavItems.map((item) => {
            if (item.id === 'workflows') { // This condition will never be true now since 'workflows' is removed from mainNavItems. We will explicitly add the Expand component.
              return null; // Will not be reached with the current mainNavItems
            }
            return (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeItem === item.id}
                isCollapsed={isCollapsed}
              />
            );
          })}

        </List>
      </nav>

      {/* Footer */}
      <div className="mt-auto shrink-0 space-y-1 bg-background-950 z-10">
        <List aria-label="Secondary navigation" className="mx-2 space-y-1">
          {secondaryNavItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={activeItem === item.id} isCollapsed={isCollapsed} />
          ))}
        </List>
        <Divider />

        <div className='px-2 pb-2'>
          {bottomNavItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={activeItem === item.id} isCollapsed={isCollapsed} />
          ))}

          <button
            className={`
w-full flex items-center gap-4 px-3 py-2.5
text-foreground-400 hover:text-red-400 hover:bg-red-500/5
rounded-sm transition-all duration-200 group
`}
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

function NavItem({ item, isActive, isCollapsed }: { item: NavItemType, isActive: boolean, isCollapsed: boolean }) {
  const Icon = item.icon;
  return (
    <a
      href="#"
      className={`
            flex items-center h-10 gap-4 px-3 rounded-sm transition-all duration-200 group relative
            ${isActive
          ? 'bg-background-900 text-foreground-100'
          : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
          `}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon
        size={17}
        className="shrink-0 transition-transform duration-200"
      />

      {!isCollapsed && (
        <span className="font-medium whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
          {item.label}
        </span>
      )}
    </a>
  )
}

