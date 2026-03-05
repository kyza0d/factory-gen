"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const STORAGE_KEY_COLLAPSED = 'sidebar_collapsed';
const STORAGE_KEY_ACTIVE_ITEM = 'sidebar_active_item';

interface SidebarContextType {
  isCollapsed: boolean;
  activeItem: string | null;
  toggleSidebar: () => void;
  setActiveItem: (id: string | null) => void;
  handleBack: () => void;
  isInitialized: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
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
    isCollapsed,
    activeItem,
    toggleSidebar,
    setActiveItem,
    handleBack,
    isInitialized,
  }), [isCollapsed, activeItem, toggleSidebar, setActiveItem, handleBack, isInitialized]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
