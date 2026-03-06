"use client"
import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { IconType } from 'react-icons';
import { FaChevronRight } from 'react-icons/fa6';
import { useApp, AppSection } from '../app-context';
import { useSidebar } from './sidebar-context';
import { useAppNavigation } from '../app-navigation';

interface NavItemProps {
  item: {
    id: string;
    label: string;
    icon: IconType;
    href?: string;
  };
  onSelect?: (id: string) => void;
  currentActiveId?: string | null;
}

export const NavItem = React.memo(function NavItem({ item, onSelect, currentActiveId }: NavItemProps) {
  const { isCollapsed } = useSidebar();
  const { activeSection } = useApp();
  const { navigateToWorkflows, navigateToDashboard, navigateToSettings, navigateToHelp } = useAppNavigation();

  const isActive = useMemo(() => {
    if (currentActiveId) {
      return currentActiveId === item.id;
    }

    // Check if the item's id matches the activeSection
    return activeSection === item.id;
  }, [activeSection, item.id, currentActiveId]);

  const Icon = item.icon;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(item.id);
      return;
    }

    if (item.href) {
      switch (item.id) {
        case 'dashboard':
          e.preventDefault();
          navigateToDashboard();
          break;
        case 'workflows':
          e.preventDefault();
          navigateToWorkflows();
          break;
        case 'settings':
          e.preventDefault();
          navigateToSettings();
          break;
        case 'help':
          e.preventDefault();
          navigateToHelp();
          break;
        default:
          // For other items with href, use standard Link behavior
          // but we can also update active section if it's a known section
          break;
      }
    }
  }, [item.id, item.href, onSelect, navigateToDashboard, navigateToWorkflows, navigateToSettings, navigateToHelp]);

  const content = (
    <>
      <Icon
        size={17}
        className="shrink-0"
      />

      {!isCollapsed && (
        <span className="font-medium whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
          {item.label}
        </span>
      )}
    </>
  );

  if (onSelect && item.href === undefined) {
    return (
      <button
        onClick={() => onSelect(item.id)}
        className={`
          flex items-center h-10 gap-4 px-3 rounded-sm transition-all duration-200 group relative w-full text-left
          ${isActive
            ? 'bg-background-900 text-foreground-100'
            : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        {content}
        {!isCollapsed && (
          <FaChevronRight size={11} className="ml-auto opacity-0 shrink-0 group-hover:opacity-70 transition-opacity" />
        )}
      </button>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={handleClick}
      className={`
        flex items-center h-10 gap-4 px-3 rounded-sm transition-all duration-200 group relative
        ${isActive
          ? 'bg-background-900 text-foreground-100'
          : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'}
      `}
      title={isCollapsed ? item.label : undefined}
    >
      {content}
    </Link>
  );
});
