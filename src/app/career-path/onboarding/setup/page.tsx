'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import { TrialWorkflowSetupWorkspace } from '@/components/onboarding-settings/TrialWorkflowSetupWorkspace'
import { TrialWorkflowWorkspaceHeader } from '@/components/onboarding-settings/TrialWorkflowWorkspaceHeader'

export default function TrialWorkflowSetupPage() {
  return (
    <AppShell navMode="full">
      <div style={{ padding: '20px 24px 96px', maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 20 }}>
        <TrialWorkflowWorkspaceHeader
          title="Thiết lập quy trình thử việc"
          subtitle="Tạo quy trình thử việc chuẩn để nhân viên mới được giao đúng việc theo từng giai đoạn."
        />
        <TrialWorkflowSetupWorkspace />
      </div>
    </AppShell>
  )
}