/* eslint-disable @typescript-eslint/no-unused-vars */
// Dashboard data service — mock data for premium dashboards

export function getCurrentShift(_userId: string) {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return { id: 's1', name: 'Ca Sáng', startTime: '06:00', endTime: '14:00', status: 'current' as const };
  if (h >= 14 && h < 22) return { id: 's2', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', status: 'current' as const };
  return { id: 's3', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', status: 'upcoming' as const };
}

export function getActionItems(_userId: string, role: string) {
  if (role === 'employee') {
    return [
      { id: 'a1', icon: '📋', title: '3 việc cần làm hôm nay', description: 'Pha chế, vệ sinh, inventory', href: '/tasks', priority: 'medium' as const, badge: 3 },
    ];
  }
  if (role === 'manager') {
    return [
      { id: 'a1', icon: '🔴', title: 'Ca chiều thiếu 1 người', description: '2 tiếng nữa bắt đầu', href: '/schedule', priority: 'urgent' as const },
      { id: 'a2', icon: '📋', title: '3 đơn nghỉ phép chờ duyệt', description: 'Lan, Nam, Hoa • Nghỉ tuần sau', href: '/leave/approvals', priority: 'high' as const, badge: 3 },
      { id: 'a3', icon: '⭐', title: '2 NV đủ điều kiện thăng tiến', description: 'Nam → Leader, Hoa → Cấp 3', href: '/career-path', priority: 'medium' as const, badge: 2 },
    ];
  }
  // admin
  return [
    { id: 'a1', icon: '👔', title: 'Nam yêu cầu thăng tiến → Leader', description: 'KPI: 90% • 12 tháng • Train 5 người', href: '/career-path/promotions', priority: 'high' as const },
    { id: 'a2', icon: '💰', title: 'Bảng lương T2/2026 chờ duyệt', description: 'Tổng: 45.2M • 12 nhân viên', href: '/payroll', priority: 'high' as const },
    { id: 'a3', icon: '📋', title: '1 hợp đồng sắp hết hạn', description: 'Tuấn — 15/03/2026', href: '/employees', priority: 'medium' as const },
  ];
}

export function getMonthlyStats(_userId: string) {
  return { kpi: 85, workDays: 18, totalDays: 22, onTimeRate: 95, violations: 0 };
}

export function getWeekSchedule(_userId: string) {
  const today = new Date().getDay(); // 0=Sun
  const todayMon = today === 0 ? 6 : today - 1; // 0=Mon
  return [
    { date: new Date(), shift: { name: 'Sáng', icon: '🌅', time: '6-14' }, isToday: todayMon === 0 },
    { date: new Date(), shift: { name: 'Sáng', icon: '🌅', time: '6-14' }, isToday: todayMon === 1 },
    { date: new Date(), shift: null, isToday: todayMon === 2 },
    { date: new Date(), shift: { name: 'Chiều', icon: '🌙', time: '14-22' }, isToday: todayMon === 3 },
    { date: new Date(), shift: { name: 'Chiều', icon: '🌙', time: '14-22' }, isToday: todayMon === 4 },
    { date: new Date(), shift: { name: 'Sáng', icon: '🌅', time: '6-14' }, isToday: todayMon === 5 },
    { date: new Date(), shift: null, isToday: todayMon === 6 },
  ];
}

export function getCareerProgress(_userId: string) {
  return {
    currentLevel: 'Nhân viên Cấp 2',
    nextLevel: 'Leader',
    percentage: 58,
    skillsUnlocked: 6,
    totalSkills: 8,
    estimatedMonths: 4,
    tip: 'Nhận thêm newcomer để tăng tốc lộ trình!',
  };
}

export function getAchievements(_userId: string) {
  return {
    badges: [
      { id: 'b1', icon: '🎖️', label: 'Mentor', value: 'x2' },
      { id: 'b2', icon: '🔥', label: 'Streak', value: 15, isNew: true },
      { id: 'b3', icon: '⭐', label: 'Perfect', value: 'x1' },
      { id: 'b4', icon: '🏅', label: 'Ranking', value: '#4' },
    ],
    newAchievement: '15 ngày không lỗi',
  };
}

// Manager-specific
export function getTeamShifts(_storeId: string) {
  return [
    {
      id: 'ts1', name: 'Ca Sáng', time: '06:00 - 14:00', icon: '🌅', required: 3,
      members: [
        { id: 'm1', name: 'Minh', status: 'checked_in' as const },
        { id: 'm2', name: 'Hoa', status: 'checked_in' as const },
        { id: 'm3', name: 'Nam', status: 'checked_in' as const },
      ],
    },
    {
      id: 'ts2', name: 'Ca Chiều', time: '14:00 - 22:00', icon: '☀️', required: 3,
      members: [
        { id: 'm4', name: 'Lan', status: 'upcoming' as const },
        { id: 'm5', name: 'Tuấn', status: 'upcoming' as const },
      ],
    },
  ];
}

export function getTeamTopPerformers(_storeId: string) {
  return [
    { id: 'p1', name: 'Minh', kpi: 92, skills: 8, rank: 1 },
    { id: 'p2', name: 'Hoa', kpi: 88, skills: 7, rank: 2 },
    { id: 'p3', name: 'Nam', kpi: 85, skills: 7, rank: 3 },
  ];
}

export function getTeamWarnings(_storeId: string) {
  return [{ id: 'w1', name: 'Tuấn', kpi: 68, note: 'Cần đào tạo thêm' }];
}

// Admin / CEO specific
export function getBranchComparison() {
  return [
    { id: 'b1', name: 'Quận 1', kpi: 87, employees: 6, cost: '22M', rating: 4 },
    { id: 'b2', name: 'Quận 3', kpi: 82, employees: 6, cost: '23M', rating: 3 },
    { id: 'b3', name: 'Quận 10', kpi: 91, employees: 8, cost: '28M', rating: 5 },
    { id: 'b4', name: 'Bình Thạnh', kpi: 79, employees: 5, cost: '18M', rating: 3 },
  ];
}

export function getAdminInsights() {
  return [
    { id: 'i1', type: 'positive' as const, icon: '📈', message: 'Chi phí nhân sự giảm 5% nhờ tối ưu ca làm việc' },
    { id: 'i2', type: 'negative' as const, icon: '⚠️', message: '3 NV có KPI dưới 70% — cần đào tạo lại', action: { label: 'Xem danh sách', href: '/kpi' } },
    { id: 'i3', type: 'positive' as const, icon: '🎉', message: 'Tỷ lệ giữ chân: 95% (cao hơn TB ngành)' },
    { id: 'i4', type: 'tip' as const, icon: '💡', message: 'Gợi ý: Mở thêm chi nhánh Q7 (nhu cầu cao)' },
  ];
}

export function getAdminOverview() {
  return {
    totalCost: '45.2M',
    totalEmployees: 12,
    totalBranches: 2,
    avgKpi: 85,
    newEmployees: 2,
    costTrend: -5,
    kpiTrend: 3,
  };
}
