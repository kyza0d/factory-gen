"use client"
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { IconType } from 'react-icons';

interface NavItemProps {
  item: {
    id: string;
    label: string;
    icon: IconType;
    href: string;
  };
  isCollapsed: boolean;
}

export const NavItem = React.memo(function NavItem({ item, isCollapsed }: NavItemProps) {
  // isolated active state based only on current segment
  const segment = useSelectedLayoutSegment();
  const isActive = useMemo(() => {
    // If the href is '/', it matches only when the segment is null
    if (item.href === '/') return segment === null;
    // Otherwise, match based on the segment (e.g., 'workflows' matches '/workflows')
    return segment === item.href.replace(/^\//, '').split('/')[0];
  }, [segment, item.href]);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
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
    </Link>
  );
});
