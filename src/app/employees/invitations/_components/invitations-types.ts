import type { EmployeeInvitation } from '@/lib/mock-data-employee-ext'

export type InvitationTab = 'all' | 'pending_approval' | 'needs_revision' | 'rejected' | 'approved' | 'others'

export interface InvitationFilters {
  searchTerm: string
  selectedStore: string
  activeTab: InvitationTab
}

export interface InvitationModalDetails {
  ready: boolean
  missingFieldLabels: string[]
  completenessPercent: number
}

export interface InvitationActionHandlers {
  onOpenDetails: (invitation: EmployeeInvitation) => void
  onSendInvitation: (invitationId: string, isResend?: boolean) => Promise<void> | void
  onCopyLink: (invitationId: string) => void
  onApprove: (invitationId: string) => void
  onRequestRevision: (invitationId: string) => void
  onReject: (invitationId: string) => void
  onCancel: (invitationId: string) => void
}
