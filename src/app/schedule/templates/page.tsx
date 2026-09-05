import { redirect } from 'next/navigation'

export default function ScheduleTemplatesRedirectPage() {
  redirect('/settings/schedule-rules/shifts')
}
