'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useApp } from './app-context';

export function useAppNavigation() {
  const router = useRouter();
  const { setActiveSection, setActiveWorkflowId } = useApp();

  const navigateToWorkflow = useCallback((id: string) => {
    setActiveSection('workflows');
    setActiveWorkflowId(id);
    router.push(`/workflows/${id}`);
  }, [router, setActiveSection, setActiveWorkflowId]);

  const navigateToWorkflows = useCallback(() => {
    setActiveSection('workflows');
    setActiveWorkflowId(null);
    router.push('/workflows');
  }, [router, setActiveSection, setActiveWorkflowId]);

  const navigateToDashboard = useCallback(() => {
    setActiveSection('dashboard');
    setActiveWorkflowId(null);
    router.push('/');
  }, [router, setActiveSection, setActiveWorkflowId]);

  const navigateToSettings = useCallback(() => {
    setActiveSection('settings');
    setActiveWorkflowId(null);
    router.push('/settings');
  }, [router, setActiveSection, setActiveWorkflowId]);

  const navigateToHelp = useCallback(() => {
    setActiveSection('help');
    setActiveWorkflowId(null);
    router.push('/help');
  }, [router, setActiveSection, setActiveWorkflowId]);

  return {
    navigateToWorkflow,
    navigateToWorkflows,
    navigateToDashboard,
    navigateToSettings,
    navigateToHelp,
  };
}
