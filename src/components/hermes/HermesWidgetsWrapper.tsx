'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { AdminCopilotDrawer } from '@/components/admin/AdminCopilotDrawer';

/**
 * HermesWidgetsWrapper renders the single, unified Hermes Assistant
 * only when a user is authenticated.
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

  return <AdminCopilotDrawer />;
}
