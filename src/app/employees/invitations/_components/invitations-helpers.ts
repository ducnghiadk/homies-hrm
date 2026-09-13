import type { EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import type { InvitationFilters, InvitationTab } from './invitations-types'

export function filterInvitations(invitations: EmployeeInvitation[], filters: InvitationFilters) {
  const { activeTab, selectedStore, searchTerm } = filters

  let filtered = invitations

  if (activeTab === 'pending_approval') {
    filtered = filtered.filter((invitation) => invitation.status === 'pending_approval')
  } else if (activeTab === 'needs_revision') {
    filtered = filtered.filter((invitation) => invitation.status === 'needs_revision')
  } else if (activeTab === 'rejected') {
    filtered = filtered.filter((invitation) => invitation.status === 'rejected')
  } else if (activeTab === 'approved') {
    filtered = filtered.filter((invitation) => invitation.status === 'approved')
  } else if (activeTab === 'others') {
    filtered = filtered.filter((invitation) => !['pending_approval', 'needs_revision', 'rejected', 'approved'].includes(invitation.status))
  }

  if (selectedStore) {
    filtered = filtered.filter((invitation) => invitation.store_id === selectedStore)
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter((invitation) =>
      invitation.full_name.toLowerCase().includes(term) ||
      invitation.email.toLowerCase().includes(term) ||
      invitation.phone.includes(term) ||
      (invitation.department_name || '').toLowerCase().includes(term) ||
      (invitation.job_level || '').toLowerCase().includes(term),
    )
  }

  return filtered
}

export function getTabCount(invitations: EmployeeInvitation[], tab: InvitationTab) {
  return invitations.filter((invitation) => {
    if (tab === 'all') return true
    if (tab === 'pending_approval') return invitation.status === 'pending_approval'
    if (tab === 'needs_revision') return invitation.status === 'needs_revision'
    if (tab === 'approved') return invitation.status === 'approved'
    if (tab === 'rejected') return invitation.status === 'rejected'
    return !['pending_approval', 'needs_revision', 'approved', 'rejected'].includes(invitation.status)
  }).length
}

export function formatInvitationDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
