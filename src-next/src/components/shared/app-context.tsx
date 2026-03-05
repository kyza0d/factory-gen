'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type AppSection = 'dashboard' | 'workflows' | 'settings' | 'help' | 'nodes' | 'sources' | 'agents' | null;

interface AppContextType {
  // Application State
  activeSection: AppSection;
  activeWorkflowId: string | null;
  setActiveSection: (section: AppSection) => void;
  setActiveWorkflowId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSectionState] = useState<AppSection>(null);
  const [activeWorkflowId, setActiveWorkflowIdState] = useState<string | null>(null);

  const setActiveSection = useCallback((section: AppSection) => {
    setActiveSectionState(section);
  }, []);

  const setActiveWorkflowId = useCallback((id: string | null) => {
    setActiveWorkflowIdState(id);
  }, []);

  const value = useMemo(() => ({
    activeSection,
    activeWorkflowId,
    setActiveSection,
    setActiveWorkflowId,
  }), [
    activeSection, activeWorkflowId, setActiveSection, setActiveWorkflowId,
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
