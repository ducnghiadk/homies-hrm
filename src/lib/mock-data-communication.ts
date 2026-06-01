// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Communication
// News, Announcements, Policies, Chat, DM
// ============================================

export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  author_id: string
  author_name: string
  cover_image?: string
  likes: number
  is_liked: boolean
  published_at: string
  category: string
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent'

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  target_audience: string
  created_by: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface Policy {
  id: string
  title: string
  content: string
  version: string
  category: string
  is_mandatory: boolean
  read_count: number
  total_employees: number
  readers: string[]
  updated_at: string
  effective_date?: string
  is_read?: boolean
  summary?: string
}

export interface ChatMessage {
  id: string
  group_id: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  content: string
  type: 'text' | 'image' | 'system'
  image_url?: string
  is_pinned: boolean
  mentions: string[]
  created_at: string
}

export interface ChatGroup {
  id: string
  name: string
  store_id: string
  member_count: number
  last_message?: string
  last_message_at?: string
  unread_count: number
}

export interface DirectMessageThread {
  id: string
  participant_id: string
  participant_name: string
  participant_avatar?: string
  last_message: string
  last_message_at: string
  unread_count: number
}

// ============ News ============
export const mockNews: NewsArticle[] = [
  {
    id: 'news-001', title: 'Khai trương chi nhánh mới tại Quận 7',
    excerpt: 'Homies Milk Tea mở rộng thêm chi nhánh thứ 4 tại khu Phú Mỹ Hưng, Quận 7...',
    content: 'Chúng tôi vui mừng thông báo Homies Milk Tea sẽ khai trương chi nhánh mới tại 123 Nguyễn Lương Bằng, Phú Mỹ Hưng, Q.7 vào ngày 01/03/2026.\n\nĐây là chi nhánh thứ 4 của chuỗi và có diện tích lớn nhất với 80 chỗ ngồi.\n\nChúng tôi đang tuyển 8 nhân viên cho chi nhánh mới. Anh chị em có thể giới thiệu bạn bè!',
    author_id: 'emp-001', author_name: 'Nguyễn Minh Tuấn', cover_image: '/news/branch-q7.jpg',
    likes: 24, is_liked: false, published_at: '2026-02-14T09:00:00', category: 'Công ty',
  },
  {
    id: 'news-002', title: 'Menu mới tháng 3: Boba Matcha Sakura',
    excerpt: 'Ra mắt dòng sản phẩm mới lấy cảm hứng mùa xuân Nhật Bản...',
    content: 'Tháng 3 tới, Homies Milk Tea sẽ ra mắt 3 sản phẩm mới:\n1. Matcha Sakura Latte\n2. Hojicha Boba Frost\n3. Yuzu Genmai Tea\n\nĐào tạo pha chế bắt đầu từ 25/02. Training bắt buộc cho tất cả barista.',
    author_id: 'emp-002', author_name: 'Lê Văn Nam', likes: 18, is_liked: true,
    published_at: '2026-02-12T14:00:00', category: 'Sản phẩm',
  },
  {
    id: 'news-003', title: 'Nhân viên xuất sắc tháng 1/2026',
    excerpt: 'Chúc mừng Trần Thị Mai đạt danh hiệu NVXS tháng 1...',
    content: 'Chúc mừng Trần Thị Mai (Store Q.1) đạt danh hiệu Nhân viên xuất sắc tháng 1/2026!\n\nKPI: 95.2/100 | Chuyên cần: 100% | Nhận xét khách hàng: 4.8/5\n\nPhần thưởng: 500.000đ + 1 ngày nghỉ phép bổ sung.',
    author_id: 'emp-001', author_name: 'Nguyễn Minh Tuấn',
    likes: 32, is_liked: true, published_at: '2026-02-01T08:00:00', category: 'Nhân sự',
  },
]

// ============ Announcements ============
export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-001', title: '⚠️ Thay đổi giờ làm Tết Nguyên Đán',
    content: 'Từ 28/01 đến 02/02/2026, tất cả chi nhánh chỉ hoạt động 2 ca (Sáng + Chiều). Ca Tối tạm nghỉ.\n\nLương Tết x2 cho ngày 29-30/01, x3 cho ngày 31/01.',
    priority: 'urgent', target_audience: 'Tất cả', created_by: 'emp-001',
    expires_at: '2026-02-03T00:00:00', is_active: false, created_at: '2026-01-20T10:00:00',
  },
  {
    id: 'ann-002', title: 'Cập nhật quy trình check-in mới',
    content: 'Từ 01/03/2026, check-in bắt buộc selfie + GPS. Không chấp nhận check-in ngoài bán kính 100m.\n\nHướng dẫn chi tiết trong mục Nội quy.',
    priority: 'important', target_audience: 'Tất cả', created_by: 'emp-002',
    is_active: true, created_at: '2026-02-10T08:00:00',
  },
  {
    id: 'ann-003', title: 'Đăng ký OT cuối tuần 22-23/02',
    content: 'Cuối tuần dự kiến đông khách. Cần thêm 2 NV/ca. Đăng ký OT qua app, deadline: 18/02.',
    priority: 'normal', target_audience: 'Store Q.1, Store Q.3', created_by: 'emp-002',
    is_active: true, created_at: '2026-02-15T09:00:00',
  },
]

// ============ Policies ============
export const mockPolicies: Policy[] = [
  {
    id: 'pol-001', title: 'Nội quy làm việc chung', version: '2.0',
    content: '1. Đến đúng giờ (trước ca 5 phút)\n2. Mặc đồng phục đầy đủ\n3. Không sử dụng điện thoại khi phục vụ\n4. Vệ sinh cá nhân sạch sẽ\n5. Tuân thủ quy trình VSATTP\n6. Báo nghỉ trước 24h',
    category: 'Chung', is_mandatory: true, read_count: 14, total_employees: 15,
    readers: ['emp-001','emp-002','emp-003','emp-004','emp-005','emp-006','emp-007','emp-008','emp-009','emp-010','emp-011','emp-012','emp-013','emp-014'],
    updated_at: '2026-01-01',
  },
  {
    id: 'pol-002', title: 'Quy trình xử lý khiếu nại khách hàng', version: '1.1',
    content: 'Bước 1: Lắng nghe, xin lỗi\nBước 2: Xác nhận vấn đề\nBước 3: Đề xuất giải pháp (đổi sản phẩm, giảm giá...)\nBước 4: Ghi nhận vào hệ thống (Incident Report)\nBước 5: Báo Manager nếu khách yêu cầu bồi thường > 100k',
    category: 'Phục vụ', is_mandatory: true, read_count: 10, total_employees: 15,
    readers: ['emp-005','emp-006','emp-007','emp-008','emp-009','emp-010','emp-011','emp-012','emp-013','emp-014'],
    updated_at: '2026-02-01',
  },
  {
    id: 'pol-003', title: 'Chính sách nghỉ phép & phúc lợi', version: '1.0',
    content: '1. Phép năm: 12 ngày/năm (tăng 1 ngày/năm thâm niên)\n2. Nghỉ ốm: 5 ngày/năm (có giấy BS)\n3. Nghỉ việc riêng: 3 ngày/năm\n4. Carry-over: tối đa 5 ngày sang năm sau\n5. Advance leave: cho phép mượn trước 3 ngày',
    category: 'Nhân sự', is_mandatory: false, read_count: 8, total_employees: 15,
    readers: ['emp-001','emp-002','emp-005','emp-006','emp-007','emp-008','emp-010','emp-011'],
    updated_at: '2026-01-15',
  },
]

// ============ Chat Messages ============
export const mockChatGroups: ChatGroup[] = [
  { id: 'grp-001', name: 'Homies Milk Tea Q.1', store_id: 'store-001', member_count: 7, last_message: 'Mai nhớ kiểm tra hàng nha', last_message_at: '2026-02-15T20:30:00', unread_count: 3 },
  { id: 'grp-002', name: 'Homies Milk Tea Q.3', store_id: 'store-002', member_count: 5, last_message: 'OK anh ạ', last_message_at: '2026-02-15T18:00:00', unread_count: 0 },
  { id: 'grp-003', name: 'Homies Milk Tea Thủ Đức', store_id: 'store-003', member_count: 5, last_message: 'Máy blender bị hư rồi', last_message_at: '2026-02-15T16:00:00', unread_count: 1 },
]

export const mockChatMessages: ChatMessage[] = [
  { id: 'msg-001', group_id: 'grp-001', sender_id: 'emp-002', sender_name: 'Lê Văn Nam', content: 'Anh chị em chú ý: từ tuần sau check-in bắt buộc selfie nha', type: 'text', is_pinned: true, mentions: [], created_at: '2026-02-15T08:00:00' },
  { id: 'msg-002', group_id: 'grp-001', sender_id: 'emp-005', sender_name: 'Trần Thị Mai', content: 'Dạ em hiểu rồi ạ 👍', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T08:05:00' },
  { id: 'msg-003', group_id: 'grp-001', sender_id: 'emp-007', sender_name: 'Đặng Minh Khoa', content: '@Trần Thị Mai chị ơi, ngày mai chị làm ca sáng đúng không?', type: 'text', is_pinned: false, mentions: ['emp-005'], created_at: '2026-02-15T18:30:00' },
  { id: 'msg-004', group_id: 'grp-001', sender_id: 'emp-005', sender_name: 'Trần Thị Mai', content: 'Ừ em, 7h nha', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T18:32:00' },
  { id: 'msg-005', group_id: 'grp-001', sender_id: 'emp-002', sender_name: 'Lê Văn Nam', content: 'Mai nhớ kiểm tra hàng nha', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T20:30:00' },
]

// ============ Direct Messages ============
export const mockDMThreads: DirectMessageThread[] = [
  { id: 'dm-001', participant_id: 'emp-002', participant_name: 'Lê Văn Nam', last_message: 'OK em xử lý nha', last_message_at: '2026-02-15T17:00:00', unread_count: 0 },
  { id: 'dm-002', participant_id: 'emp-005', participant_name: 'Trần Thị Mai', last_message: 'Em gửi ảnh kiểm kê rồi ạ', last_message_at: '2026-02-15T14:20:00', unread_count: 1 },
  { id: 'dm-003', participant_id: 'emp-001', participant_name: 'Nguyễn Minh Tuấn', last_message: 'Anh review báo cáo tháng 1 giúp em nha', last_message_at: '2026-02-14T10:00:00', unread_count: 0 },
]

export const mockDMMessages: ChatMessage[] = [
  { id: 'dm-msg-001', group_id: 'dm-001', sender_id: 'emp-005', sender_name: 'Trần Thị Mai', content: 'Anh Nam ơi, máy blender #2 kêu lạ lắm ạ', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T10:30:00' },
  { id: 'dm-msg-002', group_id: 'dm-001', sender_id: 'emp-002', sender_name: 'Lê Văn Nam', content: 'Em báo cáo sự cố qua app nha, anh sẽ gọi thợ', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T10:35:00' },
  { id: 'dm-msg-003', group_id: 'dm-001', sender_id: 'emp-005', sender_name: 'Trần Thị Mai', content: 'Dạ em báo rồi ạ', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T10:40:00' },
  { id: 'dm-msg-004', group_id: 'dm-001', sender_id: 'emp-002', sender_name: 'Lê Văn Nam', content: 'OK em xử lý nha', type: 'text', is_pinned: false, mentions: [], created_at: '2026-02-15T17:00:00' },
]

// Helpers
export const getNewsByCategory = (cat: string) => cat === 'all' ? mockNews : mockNews.filter(n => n.category === cat)
export const getActiveAnnouncements = () => mockAnnouncements.filter(a => a.is_active)
export const getChatGroupsByStore = (storeId: string) => mockChatGroups.filter(g => g.store_id === storeId)
export const getMessagesByGroup = (groupId: string) => mockChatMessages.filter(m => m.group_id === groupId)
export const getDMThreadsByEmployee = () => mockDMThreads
export const getDMMessages = (threadId: string) => mockDMMessages.filter(m => m.group_id === threadId)
