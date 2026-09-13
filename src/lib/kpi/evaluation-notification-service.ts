export interface KpiEvaluationNotificationEvent {
  id: string
  monthly_review_id: string
  recipient_id: string
  type:
    | 'REVIEW_ASSIGNED'
    | 'REVIEW_DUE_24H'
    | 'REPLACEMENT_ACTIVATED'
    | 'PRIMARY_REVIEW_REQUIRED'
    | 'MANAGER_APPROVAL_REQUIRED'
    | 'REVIEW_RETURNED'
    | 'RESULT_PUBLISHED'
    | 'APPEAL_DUE_24H'
    | 'APPEAL_DECIDED'
  created_at: string
}

export function buildEvaluationNotificationEvent(input: {
  monthly_review_id: string
  recipient_id: string
  type: KpiEvaluationNotificationEvent['type']
  at: string
  existing_events: KpiEvaluationNotificationEvent[]
}): KpiEvaluationNotificationEvent | undefined {
  const { monthly_review_id, recipient_id, type, at, existing_events } = input

  const eventId = `notif_${monthly_review_id}_${recipient_id}_${type}`

  const alreadyExists = existing_events.some((event) => event.id === eventId)
  if (alreadyExists) {
    return undefined
  }

  return {
    id: eventId,
    monthly_review_id,
    recipient_id,
    type,
    created_at: at,
  }
}
