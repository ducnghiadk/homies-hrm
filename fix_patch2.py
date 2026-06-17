import sys
sys.stdout.reconfigure(encoding="utf-8")
with open("src/lib/mock-data-registration-weeks.ts", "r", encoding="utf-8") as f:
    c = f.read()

old_check = "  // NEW: Check if week is already published - prevent overwriting\n  if (ScheduleService.isWeekPublished(week.store_id, week.week_start_date)) {\n    return {\n      success: false,\n      assignmentsCount: 0,\n      message: 'Tuan ' + week.week_start_date + ' da duoc xuat ban. Khong the auto-assign. Vui long gan thu cong.'\n    }\n  }"

new_check = "  // NEW: Check if week is already published - prevent overwriting\n  // Check RegistrationWeek.status directly (from registration weeks store)\n  if (week.status === 'published') {\n    return {\n      success: false,\n      assignmentsCount: 0,\n      message: 'Tuan ' + week.week_start_date + ' da duoc xuat ban. Khong the auto-assign. Vui long gan thu cong.'\n    }\n  }"

c = c.replace(old_check, new_check)

# Remove the ScheduleService import since we no longer need it
c = c.replace("\nimport { ScheduleService } from './services/schedule-service'", "")

with open("src/lib/mock-data-registration-weeks.ts", "w", encoding="utf-8") as f:
    f.write(c)
print("Done")
