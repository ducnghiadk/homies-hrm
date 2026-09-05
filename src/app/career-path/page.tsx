'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  initCareerPathStores,
  getEmployeeCareerProgress,
  getSkills,
  getUnreadCount,
  getEmployeeSkills,
  getSkillStatus,
  getSkillEndorsements,
} from '@/lib/career-path-service';
import type { EmployeeCareerProgress, Skill, SkillCategory, SkillEndorsement } from '@/lib/career-path-types';
import ProgressRing from '@/components/career-path/ProgressRing';
import ProgressBar from '@/components/career-path/ProgressBar';
import SkillHexagon from '@/components/career-path/SkillHexagon';
import SkillDetailModal from '@/components/career-path/SkillDetailModal';
import { CareerIcon } from '@/lib/career-path-icon-helper';
import {
  Bell,
  ChevronRight,
  Award,
  TrendingUp,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
  Target,
  Trophy,
  HelpCircle,
  Flame,
  Plus,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

initCareerPathStores();

export default function CareerPathPage() {
  const [progress] = useState<EmployeeCareerProgress | null>(() =>
    getEmployeeCareerProgress('emp-001', 'level-staff')
  );
  const [unreadNotif] = useState(() => getUnreadCount('emp-001'));
  const [selectedCategory, setSelectedCategory] = useState<'all' | SkillCategory>('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const skills = useMemo(() => getSkills().filter((s) => s.is_active), []);
  const employeeSkills = useMemo(() => getEmployeeSkills('emp-001'), []);
  const allEndorsements = useMemo(() => getSkillEndorsements('emp-001'), []);

  const unlockedSkillIds = useMemo(
    () => new Set(employeeSkills.filter((s) => s.status === 'unlocked').map((s) => s.skill_id)),
    [employeeSkills]
  );

  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') return skills;
    return skills.filter((s) => s.category === selectedCategory);
  }, [skills, selectedCategory]);

  if (!progress) {
    return (
      <AppShell title="Lộ Trình Sự Nghiệp">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center mx-auto animate-pulse">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-base font-bold text-[#001D3D]">Đang tải lộ trình sự nghiệp...</h3>
            <p className="text-xs text-gray-500">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const selectedSkillStatus = selectedSkill
    ? getSkillStatus('emp-001', selectedSkill.id)?.status ||
      (unlockedSkillIds.has(selectedSkill.id) ? 'unlocked' : 'locked')
    : 'locked';

  const selectedSkillEndorsements = selectedSkill
    ? allEndorsements.filter((e: SkillEndorsement) => e.skill_id === selectedSkill.id)
    : [];

  const handleOpenSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsDetailOpen(true);
  };

  return (
    <AppShell title="Lộ Trình Sự Nghiệp">
      <div className="space-y-6 pb-12">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TẦNG 1: EXECUTIVE COMMAND HEADER                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Trái: Breadcrumb + Tiêu đề + Trạng thái */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>Homies HRM</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span>Nhân Sự</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Lộ Trình Sự Nghiệp</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                  Lộ Trình Sự Nghiệp &amp; Phát Triển
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#2F6FA8] border border-blue-200">
                  ● Cấp Bậc: {progress.current_level.name}
                </span>
              </div>
            </div>

            {/* Phải: Thông báo + Điều hướng nhanh */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/career-path/notifications"
                className="relative p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition shadow-2xs flex items-center justify-center"
                title="Thông báo lộ trình"
              >
                <Bell size={18} className="text-gray-600" />
                {unreadNotif > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                    {unreadNotif}
                  </span>
                )}
              </Link>

              <Link
                href="/career-path/leaderboard"
                className="px-3 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 transition shadow-2xs"
              >
                <Trophy size={14} className="text-amber-500" />
                <span>Bảng Xếp Hạng</span>
              </Link>

              <Link
                href="/career-path/promotion"
                className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <TrendingUp size={14} />
                <span>Xét Thăng Cấp</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ (Macro KPI Cards)         */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Thẻ 1: Cấp Bậc Hiện Tại */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Cấp Bậc Hiện Tại</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-bold text-[#001D3D] flex items-center gap-2">
                <span>{progress.current_level.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                <span className="font-mono font-semibold text-gray-700">Skill Level {progress.current_skill_level}</span>
                <span>•</span>
                <span className="font-mono font-semibold text-gray-700">{progress.months_at_current_level} tháng</span>
                <span>thâm niên</span>
              </div>
            </div>
          </div>

          {/* Thẻ 2: Tiến Độ Thăng Cấp */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Tiến Độ Thăng Cấp</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums">
                {progress.promotion_progress_percent}%
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                <span>Lên mục tiêu:</span>
                <span className="font-bold text-[#001D3D]">{progress.next_level ? progress.next_level.name : 'Cấp tối đa'}</span>
              </div>
            </div>
          </div>

          {/* Thẻ 3: Kỹ Năng Đã Đạt */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Kỹ Năng Đã Mở Khóa</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-[#001D3D] font-mono tabular-nums">
                {progress.skills_unlocked} <span className="text-sm font-normal text-gray-400 font-sans">/ {progress.skills_total}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px]">
                <span className="text-emerald-600 font-bold font-mono">
                  {Math.round((progress.skills_unlocked / (progress.skills_total || 1)) * 100)}%
                </span>
                <span className="text-gray-400">hoàn thành ma trận</span>
              </div>
            </div>
          </div>

          {/* Thẻ 4: Mục Tiêu & Thành Tích */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Mục Tiêu &amp; Thành Tích</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-[#001D3D] font-mono tabular-nums">
                {progress.active_goals.length}{' '}
                <span className="text-xs font-normal text-gray-400 font-sans">mục tiêu</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                <span className="font-mono font-bold text-amber-600">{progress.recent_achievements.length}</span>
                <span>huy hiệu vinh danh</span>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* TẦNG 3: BỘ KHỐI NGHIỆP VỤ THEO TỶ LỆ VÀNG (2/3 + 1/3)    */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ═══════════════════════════════════════════════════════ */}
          {/* CỘT CHÍNH (2/3 bên trái - 8 cột)                        */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* Thẻ Hero Lộ Trình Thăng Tiến (Executive Navy Style) */}
            <div className="bg-gradient-to-br from-[#001D3D] via-[#0B2B4F] to-[#1D3E61] rounded-2xl p-5 sm:p-6 text-white shadow-md border border-blue-900/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-semibold">
                    <CareerIcon icon={progress.current_level.icon} size={13} />
                    <span>Lộ Trình Nhân Sự Chuỗi Homies</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>{progress.current_level.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/15 text-blue-100 font-mono font-medium">
                      Skill Level {progress.current_skill_level}
                    </span>
                  </h2>

                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Bạn đã gắn bó <strong className="text-white font-mono">{progress.months_at_current_level} tháng</strong> ở cấp bậc hiện tại. Tiếp tục hoàn thiện kỹ năng chuyên môn để sẵn sàng xét duyệt lên bậc tiếp theo.
                  </p>
                </div>

                <div className="flex flex-col items-center sm:items-end justify-center">
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs border border-white/10 flex items-center gap-3">
                    <ProgressRing
                      value={progress.skills_progress_percent}
                      size={68}
                      strokeWidth={6}
                      color="#38BDF8"
                      bgColor="rgba(255, 255, 255, 0.15)"
                      textColor="text-white"
                    />
                    <div className="text-left pr-2">
                      <div className="text-[11px] text-blue-200 font-medium">Kỹ Năng Đạt Chuẩn</div>
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        {progress.skills_unlocked}/{progress.skills_total} Kỹ năng
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Level Progression Bar */}
              {progress.next_level && (
                <div className="mt-5 pt-4 border-t border-white/15">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-blue-200 font-medium">
                      <span>Mục tiêu kế tiếp:</span>
                      <strong className="text-white font-bold flex items-center gap-1">
                        <CareerIcon icon={progress.next_level.icon} size={14} />
                        {progress.next_level.name}
                      </strong>
                    </span>
                    <span className="font-mono font-bold text-sky-300 tabular-nums">
                      {progress.promotion_progress_percent}% hoàn tất
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${progress.promotion_progress_percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ma Trận Kỹ Năng Của Tôi (Skill Matrix Card) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#001D3D]">
                      Ma Trận Kỹ Năng Của Tôi
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-[#2F6FA8]">
                      {progress.skills_unlocked}/{skills.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nhấp vào từng ô kỹ năng để xem chi tiết tiêu chuẩn hoặc xin xác nhận bảo chứng
                  </p>
                </div>

                <Link
                  href="/career-path/skills"
                  className="text-xs font-bold text-[#2F6FA8] hover:text-[#1D3E61] flex items-center gap-1 transition"
                >
                  <span>Xem danh mục đầy đủ</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Bộ lọc Danh Mục Kỹ Năng (Filter Chips) */}
              <div className="flex items-center gap-1.5 flex-wrap border-b border-gray-100 pb-3">
                {[
                  { id: 'all', label: 'Tất cả', count: skills.length },
                  { id: 'basic', label: 'Cơ bản', count: skills.filter((s) => s.category === 'basic').length },
                  { id: 'advanced', label: 'Nâng cao', count: skills.filter((s) => s.category === 'advanced').length },
                  { id: 'management', label: 'Quản lý', count: skills.filter((s) => s.category === 'management').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      selectedCategory === tab.id
                        ? 'bg-[#2F6FA8] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        selectedCategory === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Lưới Kỹ Năng (Hexagon Grid) */}
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start pt-2">
                {filteredSkills.map((skill) => {
                  const empSkill = getSkillStatus('emp-001', skill.id);
                  const status =
                    empSkill?.status || (unlockedSkillIds.has(skill.id) ? 'unlocked' : 'locked');
                  const endorsements = allEndorsements.filter((e: SkillEndorsement) => e.skill_id === skill.id);

                  return (
                    <SkillHexagon
                      key={skill.id}
                      icon={skill.icon}
                      name={skill.name}
                      status={status}
                      category={skill.category}
                      size={76}
                      endorsementCount={endorsements.length}
                      onClick={() => handleOpenSkill(skill)}
                    />
                  );
                })}
              </div>

              {/* Chú thích trạng thái (Legend) */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span>Đã mở khóa &amp; đạt chuẩn</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span>Đang rèn luyện</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
                    <span>Chưa mở khóa</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 italic">
                  ⭐ Có bảo chứng từ Leader / Mentor
                </div>
              </div>
            </div>

            {/* Điều Kiện Thăng Cấp (Promotion Requirements Checklist) */}
            {progress.next_level && progress.promotion_conditions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#001D3D]">
                        Điều Kiện Xét Lên {progress.next_level.name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Đáp ứng đủ 100% tiêu chuẩn bên dưới để gửi yêu cầu phê duyệt
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {progress.promotion_conditions.filter((c) => c.is_met).length}/
                    {progress.promotion_conditions.length} Đạt Chuẩn
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {progress.promotion_conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        cond.is_met
                          ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                          : 'bg-gray-50/70 border-gray-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {cond.is_met ? (
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Clock size={16} className="text-amber-600 flex-shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-gray-800">
                            {cond.condition.label}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold tabular-nums ${
                            cond.is_met ? 'text-emerald-700' : 'text-gray-600'
                          }`}
                        >
                          {cond.current_value} / {cond.condition.value}
                        </span>
                      </div>

                      <ProgressBar
                        value={cond.progress_percent}
                        height={6}
                        color={cond.is_met ? 'bg-emerald-500' : 'bg-[#2F6FA8]'}
                        bgColor="bg-gray-200"
                        showValue={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* CỘT PHỤ (1/3 bên phải - 4 cột)                          */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Widget 1: Mục Tiêu Cá Nhân (Active Goals) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                    <Target size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-[#001D3D]">Mục Tiêu Đang Thực Hiện</h3>
                </div>
                <Link
                  href="/career-path/goals"
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#2F6FA8] transition"
                  title="Thêm mục tiêu mới"
                >
                  <Plus size={16} />
                </Link>
              </div>

              {progress.active_goals.length > 0 ? (
                <div className="space-y-3">
                  {progress.active_goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 hover:bg-gray-50 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 leading-snug">
                          {goal.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                        <span>Hạn: {goal.target_date}</span>
                      </div>
                      <ProgressBar
                        value={goal.progress}
                        height={5}
                        color="bg-emerald-500"
                        showValue={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">
                  Chưa có mục tiêu nào đang chạy.
                </div>
              )}

              <Link
                href="/career-path/goals"
                className="block text-center text-xs font-bold text-[#2F6FA8] hover:text-[#1D3E61] pt-1"
              >
                Quản lý tất cả mục tiêu →
              </Link>
            </div>

            {/* Widget 2: Thành Tích & Huy Hiệu (Recent Achievements) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Award size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-[#001D3D]">Thành Tích &amp; Huy Hiệu</h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {progress.recent_achievements.length} Đã Đạt
                </span>
              </div>

              <div className="space-y-2.5">
                {progress.recent_achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-2.5 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100/60 text-amber-700 flex items-center justify-center font-bold">
                      <CareerIcon icon={ach.icon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{ach.title}</div>
                      <div className="text-[11px] text-gray-500 truncate">{ach.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Người Hướng Dẫn Kèm Cặp (Buddy / Mentor) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                  <Users size={15} />
                </div>
                <h3 className="text-sm font-bold text-[#001D3D]">Người Hướng Dẫn Đồng Hành</h3>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#2F6FA8] text-white flex items-center justify-center font-bold text-xs">
                    TL
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Trần Thị Lan</div>
                    <div className="text-[11px] text-gray-500 font-medium">Quản lý Cửa hàng (Store Manager)</div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 italic">
                  "Kèm cặp trực tiếp quy trình kiểm soát chất lượng đồ uống &amp; thao tác mở ca chuẩn F&amp;B."
                </p>
              </div>

              <button className="w-full py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition shadow-2xs">
                Gửi Tin Nhắn Nhờ Đánh Giá
              </button>
            </div>

            {/* Widget 4: Gợi Ý Phát Triển (Smart Suggestions) */}
            {progress.smart_suggestions && progress.smart_suggestions.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Flame size={15} className="text-amber-600" />
                  <span>Gợi Ý Phát Triển Nhanh</span>
                </div>
                <p className="text-[11px] text-amber-950 leading-relaxed font-medium">
                  {progress.smart_suggestions[0]?.description ||
                    'Bạn sắp đủ điều kiện mở khóa kỹ năng Nhập Hàng! Hãy xin ý kiến Leader để mở khóa.'}
                </p>
                {progress.smart_suggestions[0]?.action_link && (
                  <Link
                    href={progress.smart_suggestions[0].action_link}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 transition"
                  >
                    <span>Thực hiện ngay</span>
                    <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MODAL BÓC TÁCH CHI TIẾT KỸ NĂNG                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SkillDetailModal
          skill={selectedSkill}
          status={selectedSkillStatus}
          endorsements={selectedSkillEndorsements}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onRequestUnlock={(skillId) => {
            alert(`Đã gửi yêu cầu đăng ký/đánh giá cho kỹ năng: ${skillId}`);
          }}
        />
      </div>
    </AppShell>
  );
}
