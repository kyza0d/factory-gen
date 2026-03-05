'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type AppSection = 'dashboard' | 'workflows' | 'settings' | 'help' | 'nodes' | 'sources' | 'agents' | null;

const STORAGE_KEY_COLLAPSED = 'sidebar_collapsed';
const STORAGE_KEY_ACTIVE_ITEM = 'sidebar_active_item';

interface AppContextType {
  // Application State
  activeSection: AppSection;
  activeWorkflowId: string | null;
  setActiveSection: (section: AppSection) => void;
  setActiveWorkflowId: (id: string | null) => void;

  // Sidebar State (formerly in SidebarContext)
  isCollapsed: boolean;
  activeItem: string | null;
  toggleSidebar: () => void;
  setActiveItem: (id: string | null) => void;
  handleBack: () => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSectionState] = useState<AppSection>(null);
  const [activeWorkflowId, setActiveWorkflowIdState] = useState<string | null>(null);

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItemState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem(STORAGE_KEY_COLLAPSED);
    const savedActiveItem = localStorage.getItem(STORAGE_KEY_ACTIVE_ITEM);

    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === 'true');
    }
    if (savedActiveItem !== null) {
      setActiveItemState(savedActiveItem);
    }
    setIsInitialized(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(isCollapsed));
    }
  }, [isCollapsed, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      if (activeItem) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ITEM, activeItem);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ITEM);
      }
    }
  }, [activeItem, isInitialized]);

  // Sync state with pathname for deep-links and browser back/forward
  const setActiveSection = useCallback((section: AppSection) => {
    setActiveSectionState(section);
  }, []);

  const setActiveWorkflowId = useCallback((id: string | null) => {
    setActiveWorkflowIdState(id);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleBack = useCallback(() => {
    setActiveItemState(null);
  }, []);

  const setActiveItem = useCallback((id: string | null) => {
    setActiveItemState(id);
  }, []);

  const value = useMemo(() => ({
    activeSection,
    activeWorkflowId,
    setActiveSection,
    setActiveWorkflowId,
    isCollapsed,
    activeItem,
    toggleSidebar,
    setActiveItem,
    handleBack,
    isInitialized,
  }), [
    activeSection, activeWorkflowId, setActiveSection, setActiveWorkflowId,
    isCollapsed, activeItem, toggleSidebar, setActiveItem, handleBack, isInitialized
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// For backward compatibility
export const useSidebar = useApp;
