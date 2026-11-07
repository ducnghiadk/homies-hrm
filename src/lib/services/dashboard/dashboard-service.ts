/* eslint-disable @typescript-eslint/no-unused-vars */
// Dashboard data service — mock data for premium dashboards

export function getCurrentShift(_userId: string) {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return { id: 's1', name: 'Ca Sáng', startTime: '06:00', endTime: '14:00', status: 'current' as const };
  if (h >= 14 && h < 22) return { id: 's2', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', status: 'current' as const };
  return { id: 's3', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', status: 'upcoming' as const };
}

export interface DashboardActionItem {
  id: string;
  icon: string;
  title: string;
  description?: string;
  href: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  badge?: number;
  deadline?: string;
}

export function getActionItems(_userId: string, role: string): DashboardActionItem[] {
  if (role === 'employee') {
    return [
      { id: 'a1', icon: '📋', title: 'Việc cần làm hôm nay', description: 'Pha chế, vệ sinh quầy, kiểm tồn', href: '/tasks/daily', priority: 'medium', badge: 3 },
    ];
  }
  if (role === 'manager') {
    return [
      { id: 'a1', icon: '🔴', title: 'Ca trực cần theo dõi quân số', description: 'Đảm bảo định biên nhân sự theo ca', href: '/schedule', priority: 'urgent' },
      { id: 'a2', icon: '📋', title: 'Đơn chờ quản lý phê duyệt', description: 'Xem xét các yêu cầu đổi ca, nghỉ phép', href: '/leave/approval', priority: 'high' },
      { id: 'a3', icon: '⭐', title: 'Lộ trình thăng tiến nhân sự', description: 'Xem xét đề xuất thăng cấp nhân viên', href: '/career-path', priority: 'medium' },
    ];
  }
  // admin
  return [
    { id: 'a1', icon: '👔', title: 'Đề xuất thăng tiến nhân sự', description: 'Xem xét các hồ sơ thăng cấp toàn chuỗi', href: '/career-path', priority: 'high' },
    { id: 'a2', icon: '💰', title: 'Bảng lương chuỗi chờ đối soát', description: 'Kiểm tra chi phí & tổng lương các cửa hàng', href: '/payroll', priority: 'high' },
    { id: 'a3', icon: '📋', title: 'Theo dõi hợp đồng lao động', description: 'Quản lý thời hạn hợp đồng nhân sự', href: '/employees/contracts', priority: 'medium' },
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
export function getTeamShifts(storeId?: string) {
  if (storeId === 'store-002') {
    return [
      {
        id: 'ts1', name: 'Ca Sáng', time: '06:00 - 14:00', icon: '🌅', required: 2,
        members: [
          { id: 'emp-nv0028', name: 'Phạm Nguyễn Đông Duy', status: 'checked_in' as const },
          { id: 'emp-nv0017', name: 'Nguyễn Thanh Thiện', status: 'checked_in' as const },
        ],
      },
      {
        id: 'ts2', name: 'Ca Chiều', time: '14:00 - 22:00', icon: '☀️', required: 2,
        members: [
          { id: 'emp-nv0020', name: 'Lê Minh Lộc', status: 'upcoming' as const },
          { id: 'emp-nv0034', name: 'Nguyễn Thị Thu', status: 'upcoming' as const },
        ],
      },
    ];
  }

  // Mặc định store-001 (Homies Milk Tea - Hồ Bá Phấn)
  return [
    {
      id: 'ts1', name: 'Ca Sáng', time: '06:00 - 14:00', icon: '🌅', required: 3,
      members: [
        { id: 'emp-nv0024', name: 'Tấn Hiếu', status: 'checked_in' as const },
        { id: 'emp-nv0013', name: 'Nguyễn Thị Tú Trinh', status: 'checked_in' as const },
        { id: 'emp-nv0030', name: 'Quách Thị Kim Chi', status: 'checked_in' as const },
      ],
    },
    {
      id: 'ts2', name: 'Ca Chiều', time: '14:00 - 22:00', icon: '☀️', required: 3,
      members: [
        { id: 'emp-nv0031', name: 'Cao Văn Thắng', status: 'upcoming' as const },
        { id: 'emp-nv0033', name: 'Nguyễn Hoài Ân', status: 'upcoming' as const },
        { id: 'emp-nv0035', name: 'Nguyễn Mạnh Duy', status: 'upcoming' as const },
      ],
    },
  ];
}

export function getTeamTopPerformers(storeId?: string) {
  if (storeId === 'store-002') {
    return [
      { id: 'emp-nv0028', name: 'Đông Duy', kpi: 93, skills: 8, rank: 1 },
      { id: 'emp-nv0020', name: 'Minh Lộc', kpi: 90, skills: 8, rank: 2 },
      { id: 'emp-nv0017', name: 'Thanh Thiện', kpi: 86, skills: 7, rank: 3 },
    ];
  }
  return [
    { id: 'emp-nv0024', name: 'Tấn Hiếu', kpi: 94, skills: 8, rank: 1 },
    { id: 'emp-nv0013', name: 'Tú Trinh', kpi: 91, skills: 8, rank: 2 },
    { id: 'emp-nv0030', name: 'Kim Chi', kpi: 88, skills: 7, rank: 3 },
  ];
}

export function getTeamWarnings(storeId?: string) {
  if (storeId === 'store-002') {
    return [{ id: 'w2', name: 'Nguyễn Thị Thu', kpi: 74, note: 'Cần kèm cặp thao tác POS' }];
  }
  return [{ id: 'w1', name: 'Nguyễn Mạnh Duy', kpi: 72, note: 'Cần đào tạo thêm quy trình pha chế' }];
}

// Admin / CEO specific
export function getBranchComparison() {
  return [
    { id: 'store-001', name: 'Homies - Hồ Bá Phấn', kpi: 92, employees: 8, cost: '22.3M', rating: 5 },
    { id: 'store-002', name: 'Homies - Đường 429', kpi: 88, employees: 6, cost: '21.2M', rating: 4 },
  ];
}

export function getAdminInsights(data?: { totalNetPayroll?: number; headcount?: number; shiftCount?: number }) {
  const cost = data?.totalNetPayroll ? `${(data.totalNetPayroll / 1000000).toFixed(1)}M` : '43.5M';
  const emp = data?.headcount ? `${data.headcount} phiếu lương` : '14 phiếu lương';
  return [
    { id: 'i1', type: 'positive' as const, icon: '📈', message: `Chi phí nhân sự tối ưu đạt ${cost} cho ${emp} tháng 08/2026` },
    { id: 'i2', type: 'positive' as const, icon: '☕', message: 'Chi nhánh Hồ Bá Phấn vận hành trơn tru các ca làm việc' },
    { id: 'i3', type: 'positive' as const, icon: '🎉', message: 'Tỷ lệ đi làm đúng giờ toàn chuỗi đạt 98%' },
    { id: 'i4', type: 'tip' as const, icon: '💡', message: 'Đang theo dõi chuẩn bị mở chi nhánh Homies - Lê Văn Sỹ' },
  ];
}

export function getAdminOverview() {
  return {
    totalCost: '43.5M',
    totalEmployees: 25,
    totalBranches: 2,
    avgKpi: 90,
    newEmployees: 2,
    costTrend: -3,
    kpiTrend: 2,
  };
}
