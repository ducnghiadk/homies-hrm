import sys
sys.stdout.reconfigure(encoding="utf-8")
with open("src/tests/unit/auto-assign.test.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix 1: Create week with published status directly
old1 = "    createOrUpdateRegistrationWeek({"
new1 = "    const week = createOrUpdateRegistrationWeek({"
c = c.replace(old1, new1)

# Fix 2: Remove status open, make it published
old2 = "      status: 'open',"
new2 = "      status: 'published',"
c = c.replace(old2, new2)

# Fix 3: Remove ScheduleService.publishWeek call
old3 = "    // Publish the week via ScheduleService\n    const weekDates = ScheduleService.getWeekDates('2026-06-22')\n    ScheduleService.publishWeek(mockUser, targetStoreId, weekDates)\n    \n    "
new3 = "    "
c = c.replace(old3, new3)

# Fix 4: Simplify the act block
old4 = "    // Act: run auto-assign on published week\n    const week = getRegistrationWeekById('reg-week-next-week')\n    if (!week) {\n      // Try to find the created week\n      const allWeeks = (globalThis as any).__registrationWeeks || []\n      const targetWeek = allWeeks.find((w) => w.week_start_date === '2026-06-22')\n      if (targetWeek) {\n        const result = autoAssignFromPreferences(targetWeek.id)\n        expect(result.success).toBe(false)\n        expect(result.message).toContain('published')\n        expect(result.message).toContain('xuat ban')\n      }\n      return\n    }\n    \n    const result = autoAssignFromPreferences(week.id)"
new4 = "    // Act: run auto-assign on published week\n    const result = autoAssignFromPreferences(week.id)"
c = c.replace(old4, new4)

with open("src/tests/unit/auto-assign.test.ts", "w", encoding="utf-8") as f:
    f.write(c)
print("Done")
