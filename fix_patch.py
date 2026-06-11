import sys
sys.stdout.reconfigure(encoding="utf-8")
with open("src/lib/mock-data-registration-weeks.ts", "r", encoding="utf-8") as f:
    c = f.read()
if "ScheduleService" not in c:
    c = c.replace(
        "import { mockShifts, mockEmployees, mockSchedules, initSchedules, saveSchedulesToStorage } from './mock-data'",
        "import { mockShifts, mockEmployees, mockSchedules, initSchedules, saveSchedulesToStorage } from './mock-data'\nimport { ScheduleService } from './services/schedule-service'"
    )
    c = c.replace(
        "  const quotas = getShiftQuotas(weekId)",
        "  // NEW: Check if week is already published - prevent overwriting\n  if (ScheduleService.isWeekPublished(week.store_id, week.week_start_date)) {\n    return {\n      success: false,\n      assignmentsCount: 0,\n      message: 'Tuan ' + week.week_start_date + ' da duoc xuat ban. Khong the auto-assign. Vui long gan thu cong.'\n    }\n  }\n\n  const quotas = getShiftQuotas(weekId)"
    )
with open("src/lib/mock-data-registration-weeks.ts", "w", encoding="utf-8") as f:
    f.write(c)
print("Done. Has SS:", "ScheduleService" in open("src/lib/mock-data-registration-weeks.ts", "r", encoding="utf-8").read())
