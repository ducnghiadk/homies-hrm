'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { SmartBugReporter } from '@/components/telemetry/SmartBugReporter';
import { AdminCopilotDrawer } from '@/components/admin/AdminCopilotDrawer';

/**
 * HermesWidgetsWrapper conditionally renders Hermes interactive widgets
 * only when a user is authenticated, avoiding cluttering login/public screens.
 */
export function HermesWidgetsWrapper() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <SmartBugReporter />
      <AdminCopilotDrawer />
    </>
  );
}
