// ============================================
// HRM Trà Sữa — Phase 3 Mock Data
// Gamification, Recognition, Chat, Wellness
// ============================================

// ========== GAMIFICATION ==========

export type BadgeType = 'attendance' | 'sales' | 'service' | 'training' | 'teamwork'

export const mockBadges = [
  { id: 'badge-001', name: 'Siêu Đúng Giờ', emoji: '⏰', desc: '30 ngày check-in đúng giờ liên tiếp', type: 'attendance' as BadgeType, points_required: 300 },
  { id: 'badge-002', name: 'Vua Bán Hàng', emoji: '👑', desc: 'Top 1 doanh số tháng', type: 'sales' as BadgeType, points_required: 500 },
  { id: 'badge-003', name: 'Zero Complaint', emoji: '🛡️', desc: '3 tháng không khiếu nại', type: 'service' as BadgeType, points_required: 450 },
  { id: 'badge-004', name: 'Học Hỏi Không Ngừng', emoji: '📚', desc: 'Hoàn thành 5 khóa training', type: 'training' as BadgeType, points_required: 500 },
  { id: 'badge-005', name: 'Team Player', emoji: '🤝', desc: 'Nhận 10 kudos từ đồng nghiệp', type: 'teamwork' as BadgeType, points_required: 200 },
  { id: 'badge-006', name: 'Ngôi Sao Mới', emoji: '⭐', desc: 'Hoàn thành thử việc xuất sắc', type: 'service' as BadgeType, points_required: 100 },
]

export const mockPointsHistory = [
  { id: 'pt-001', employee_id: 'emp-005', points: 10, reason: 'Check-in đúng giờ', date: '2026-02-15', type: 'earn' },
  { id: 'pt-002', employee_id: 'emp-005', points: 50, reason: 'Không khiếu nại tuần này', date: '2026-02-14', type: 'earn' },
  { id: 'pt-003', employee_id: 'emp-005', points: 30, reason: 'Top 3 doanh số tuần', date: '2026-02-13', type: 'earn' },
  { id: 'pt-004', employee_id: 'emp-005', points: -100, reason: 'Đổi voucher trà sữa', date: '2026-02-12', type: 'spend' },
  { id: 'pt-005', employee_id: 'emp-005', points: 100, reason: 'Hoàn thành training "Pha chế nâng cao"', date: '2026-02-10', type: 'earn' },
  { id: 'pt-006', employee_id: 'emp-005', points: 10, reason: 'Check-in đúng giờ', date: '2026-02-09', type: 'earn' },
  { id: 'pt-007', employee_id: 'emp-006', points: 10, reason: 'Check-in đúng giờ', date: '2026-02-15', type: 'earn' },
  { id: 'pt-008', employee_id: 'emp-006', points: 50, reason: 'Không khiếu nại tuần này', date: '2026-02-14', type: 'earn' },
  { id: 'pt-009', employee_id: 'emp-007', points: 10, reason: 'Check-in đúng giờ', date: '2026-02-15', type: 'earn' },
]

export const mockLeaderboard = [
  { employee_id: 'emp-006', total_points: 2150, level: 'Gold', rank: 1, badges_count: 4 },
  { employee_id: 'emp-005', total_points: 1580, level: 'Silver', rank: 2, badges_count: 3 },
  { employee_id: 'emp-008', total_points: 1340, level: 'Silver', rank: 3, badges_count: 2 },
  { employee_id: 'emp-009', total_points: 980, level: 'Silver', rank: 4, badges_count: 2 },
  { employee_id: 'emp-010', total_points: 620, level: 'Bronze', rank: 5, badges_count: 1 },
  { employee_id: 'emp-007', total_points: 450, level: 'Bronze', rank: 6, badges_count: 0 },
  { employee_id: 'emp-011', total_points: 380, level: 'Bronze', rank: 7, badges_count: 1 },
  { employee_id: 'emp-012', total_points: 290, level: 'Bronze', rank: 8, badges_count: 0 },
]

export const mockEmployeeBadges: Record<string, string[]> = {
  'emp-005': ['badge-001', 'badge-005', 'badge-006'],
  'emp-006': ['badge-001', 'badge-002', 'badge-003', 'badge-006'],
  'emp-008': ['badge-005', 'badge-006'],
  'emp-009': ['badge-001', 'badge-006'],
  'emp-010': ['badge-006'],
  'emp-011': ['badge-005'],
}

export const LEVEL_THRESHOLDS = [
  { name: 'Bronze', min: 0, icon: '🥉', color: '#CD7F32' },
  { name: 'Silver', min: 500, icon: '🥈', color: '#C0C0C0' },
  { name: 'Gold', min: 2000, icon: '🥇', color: '#FFD700' },
  { name: 'Platinum', min: 5000, icon: '💎', color: '#E5E4E2' },
]

// ========== RECOGNITION ==========

export type KudosType = 'thank_you' | 'great_job' | 'team_player' | 'creative' | 'helpful'

export const KUDOS_TYPES = [
  { type: 'thank_you' as KudosType, emoji: '🙏', label: 'Cảm ơn', color: '#3b82f6' },
  { type: 'great_job' as KudosType, emoji: '🌟', label: 'Làm tốt lắm', color: '#f59e0b' },
  { type: 'team_player' as KudosType, emoji: '🤝', label: 'Team Player', color: '#10b981' },
  { type: 'creative' as KudosType, emoji: '💡', label: 'Sáng tạo', color: '#8b5cf6' },
  { type: 'helpful' as KudosType, emoji: '💪', label: 'Nhiệt tình', color: '#ef4444' },
]

export const mockKudos = [
  { id: 'kd-001', from_id: 'emp-005', to_id: 'emp-006', type: 'great_job' as KudosType, message: 'Xử lý order peak hour cực nhanh, giỏi lắm!', date: '2026-02-15', points: 5 },
  { id: 'kd-002', from_id: 'emp-006', to_id: 'emp-005', type: 'thank_you' as KudosType, message: 'Cảm ơn đã dạy mình pha Matcha mới 💚', date: '2026-02-14', points: 5 },
  { id: 'kd-003', from_id: 'emp-007', to_id: 'emp-006', type: 'helpful' as KudosType, message: 'Luôn giúp đỡ NV mới, rất nhiệt tình', date: '2026-02-13', points: 5 },
  { id: 'kd-004', from_id: 'emp-008', to_id: 'emp-005', type: 'team_player' as KudosType, message: 'Ca chiều hôm qua collab rất ăn ý!', date: '2026-02-12', points: 5 },
  { id: 'kd-005', from_id: 'emp-009', to_id: 'emp-008', type: 'creative' as KudosType, message: 'Idea trang trí quán siêu xinh 🎨', date: '2026-02-11', points: 5 },
  { id: 'kd-006', from_id: 'emp-002', to_id: 'emp-006', type: 'great_job' as KudosType, message: '⭐ Shout-out: NV xuất sắc tuần 2/2026!', date: '2026-02-10', points: 10, is_shoutout: true },
]

export const mockWallOfFame = [
  { employee_id: 'emp-006', month: '2026-02', title: 'NV xuất sắc nhất', category: 'overall', total_kudos: 12 },
  { employee_id: 'emp-005', month: '2026-01', title: 'Siêu đúng giờ', category: 'attendance', total_kudos: 8 },
  { employee_id: 'emp-008', month: '2026-01', title: 'Sáng tạo nhất', category: 'creative', total_kudos: 6 },
]

// ========== COMMUNICATION ==========

export const mockChatRooms = [
  { id: 'room-001', name: 'Boba Quận 1', type: 'store', store_id: 'store-001', members: 5, unread: 3, last_message: 'Ai đổi ca T7 được không?', last_time: '14:22' },
  { id: 'room-002', name: 'Boba Quận 3', type: 'store', store_id: 'store-002', members: 5, unread: 0, last_message: 'OK anh, em sẽ kiểm kho', last_time: '13:45' },
  { id: 'room-003', name: 'Boba Quận 7', type: 'store', store_id: 'store-003', members: 5, unread: 1, last_message: 'Menu update tháng này nha', last_time: '11:30' },
  { id: 'room-004', name: '📢 Thông báo chung', type: 'announcement', members: 15, unread: 1, last_message: 'Chính sách mới về OT...', last_time: '09:00' },
]

export const mockMessages = [
  { id: 'msg-001', room_id: 'room-001', sender_id: 'emp-005', content: 'Ai đổi ca T7 được không? Em có việc gia đình 🙏', time: '14:22', type: 'text' },
  { id: 'msg-002', room_id: 'room-001', sender_id: 'emp-006', content: 'Em đổi được nhé, T7 sáng phải không?', time: '14:25', type: 'text' },
  { id: 'msg-003', room_id: 'room-001', sender_id: 'emp-005', content: 'Đúng rồi, cảm ơn nhiều! ❤️', time: '14:26', type: 'text' },
  { id: 'msg-004', room_id: 'room-001', sender_id: 'emp-002', content: 'OK, anh approve rồi nha 2 bạn', time: '14:30', type: 'text' },
  { id: 'msg-005', room_id: 'room-001', sender_id: 'emp-007', content: 'Hehe team mình nice quá 🧋', time: '14:31', type: 'text' },
]

// ========== WELLNESS ==========

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export const MOOD_EMOJIS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😢', label: 'Rất tệ', color: '#ef4444' },
  2: { emoji: '😕', label: 'Không tốt', color: '#f97316' },
  3: { emoji: '😐', label: 'Bình thường', color: '#eab308' },
  4: { emoji: '😊', label: 'Tốt', color: '#22c55e' },
  5: { emoji: '🤩', label: 'Tuyệt vời', color: '#3b82f6' },
}

export const mockMoodCheckins = [
  { id: 'mood-001', employee_id: 'emp-005', mood: 4 as MoodLevel, note: 'Ca sáng vui, khách đông', date: '2026-02-15' },
  { id: 'mood-002', employee_id: 'emp-005', mood: 3 as MoodLevel, note: '', date: '2026-02-14' },
  { id: 'mood-003', employee_id: 'emp-005', mood: 5 as MoodLevel, note: 'Được thưởng tháng 🎉', date: '2026-02-13' },
  { id: 'mood-004', employee_id: 'emp-005', mood: 2 as MoodLevel, note: 'Mệt, OT nhiều quá', date: '2026-02-12' },
  { id: 'mood-005', employee_id: 'emp-005', mood: 4 as MoodLevel, note: '', date: '2026-02-11' },
  { id: 'mood-006', employee_id: 'emp-005', mood: 4 as MoodLevel, note: 'Team vui', date: '2026-02-10' },
  { id: 'mood-007', employee_id: 'emp-005', mood: 3 as MoodLevel, note: '', date: '2026-02-09' },
]

export const mockFeedbackBox = [
  { id: 'fb-001', category: 'workplace', content: 'Máy pha espresso cần bảo trì, áp suất yếu', date: '2026-02-14', status: 'pending' as const },
  { id: 'fb-002', category: 'schedule', content: 'Nên có thêm 1 NV ca tối T7-CN vì đông khách', date: '2026-02-12', status: 'reviewed' as const },
  { id: 'fb-003', category: 'culture', content: 'Team building tháng rồi rất vui, nên tổ chức thường xuyên hơn 🎉', date: '2026-02-10', status: 'resolved' as const },
]

// ========== HELPERS ==========

export const getPlayerLevel = (points: number) => {
  const levels = [...LEVEL_THRESHOLDS].reverse()
  return levels.find(l => points >= l.min) || LEVEL_THRESHOLDS[0]
}

export const getLeaderboardEntry = (empId: string) =>
  mockLeaderboard.find(l => l.employee_id === empId)

export const getEmployeeBadges = (empId: string) =>
  (mockEmployeeBadges[empId] || []).map(bid => mockBadges.find(b => b.id === bid)!).filter(Boolean)

export const getKudosForEmployee = (empId: string) =>
  mockKudos.filter(k => k.to_id === empId)

export const getMoodHistory = (empId: string) =>
  mockMoodCheckins.filter(m => m.employee_id === empId).sort((a,b) => b.date.localeCompare(a.date))
