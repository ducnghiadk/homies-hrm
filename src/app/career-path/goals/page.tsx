'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  initCareerPathStores,
  getEmployeeGoals,
  createGoal,
  cancelGoal,
  getSuggestedGoals,
  getSettings,
} from '@/lib/career-path-service';
import type { CareerGoal } from '@/lib/career-path-types';
import ProgressBar from '@/components/career-path/ProgressBar';
import {
  ChevronRight,
  ArrowLeft,
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Trash2,
  HelpCircle,
  Award,
  AlertCircle,
} from 'lucide-react';

initCareerPathStores();

export default function GoalsPage() {
  const [goals, setGoals] = useState<CareerGoal[]>(() => getEmployeeGoals('emp-001'));
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const empId = 'emp-001';

  const reload = () => {
    setGoals(getEmployeeGoals(empId));
  };

  const active = goals.filter((g) => g.status === 'active');
  const achieved = goals.filter((g) => g.status === 'achieved');
  const settings = typeof window !== 'undefined' ? getSettings() : { max_active_goals: 3 };
  const suggested = getSuggestedGoals(empId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createGoal(empId, {
      type: 'custom',
      title: newTitle.trim(),
      target_date: newTarget || '2026-06-01',
      custom_description: newTitle.trim(),
    });
    setNewTitle('');
    setNewTarget('');
    setShowAdd(false);
    reload();
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy mục tiêu này?')) {
      cancelGoal(id);
      reload();
    }
  };

  const handleAddSuggested = (s: Partial<CareerGoal>) => {
    createGoal(empId, { ...s, target_date: '2026-06-01' });
    reload();
  };

  const avgProgress =
    active.length > 0
      ? Math.round(active.reduce((acc, curr) => acc + curr.progress, 0) / active.length)
      : 0;

  return (
    <AppShell title="Mục Tiêu Cá Nhân">
      <div className="space-y-6 pb-12">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TẦNG 1: EXECUTIVE COMMAND HEADER                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Link href="/career-path" className="hover:text-[#2F6FA8] transition">
                  Lộ Trình Sự Nghiệp
                </Link>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Mục Tiêu Cá Nhân</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/career-path"
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                  title="Quay lại lộ trình"
                >
                  <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg sm:text-xl font-bold text-[#001D3D] tracking-tight">
                  Mục Tiêu Cá Nhân &amp; Kế Hoạch Rèn Luyện
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdd(!showAdd)}
                disabled={active.length >= settings.max_active_goals}
                className={`px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                  active.length >= settings.max_active_goals
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#2F6FA8] hover:bg-[#1D3E61] text-white'
                }`}
              >
                <Plus size={15} />
                <span>Thêm Mục Tiêu ({active.length}/{settings.max_active_goals})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dải 3 Thẻ Chỉ Số Vĩ Mô */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500">Mục Tiêu Đang Chạy</span>
              <div className="text-2xl font-bold font-mono text-[#001D3D] mt-1 tabular-nums">
                {active.length} <span className="text-xs font-normal text-gray-400 font-sans">/ {settings.max_active_goals} tối đa</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
              <Target size={20} />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500">Mục Tiêu Đã Hoàn Thành</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {achieved.length} <span className="text-xs font-normal text-gray-400 font-sans">mục tiêu</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500">Tiến Độ Trung Bình</span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {avgProgress}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
          </div>
        </div>

        {/* Form Tạo Mục Tiêu Mới (Collapsible) */}
        {showAdd && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-md animate-in slide-in-from-top-2 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-[#2F6FA8]" />
                <h3 className="text-sm font-bold text-[#001D3D]">Thiết Lập Mục Tiêu Mới</h3>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Hủy bỏ
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Tên Mục Tiêu / Kế Hoạch *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Mở khóa Kỹ Năng Pha Chế Nâng Cao"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Hạn Hoàn Thành Dự Kiến (Deadline)
                  </label>
                  <input
                    type="date"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-[#2F6FA8]/20 focus:border-[#2F6FA8] font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-bold transition shadow-xs"
                >
                  Tạo Mục Tiêu
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bố Cục Tỷ Lệ Vàng (2/3 Cột Chính + 1/3 Cột Phụ) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT CHÍNH: DANH SÁCH MỤC TIÊU (8 cột) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Mục Tiêu Đang Chạy */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <h3 className="text-sm sm:text-base font-bold text-[#001D3D]">
                    Mục Tiêu Đang Thực Hiện ({active.length})
                  </h3>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Tối đa {settings.max_active_goals} mục tiêu đồng thời
                </span>
              </div>

              {active.length > 0 ? (
                <div className="space-y-3">
                  {active.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl hover:bg-gray-50 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#001D3D]">
                            {goal.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              Hạn chót: {goal.target_date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {goal.progress}%
                          </span>
                          <button
                            onClick={() => handleCancel(goal.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hủy mục tiêu này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <ProgressBar
                        value={goal.progress}
                        height={7}
                        color="bg-emerald-500"
                        showValue={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-xs">
                  Bạn chưa có mục tiêu nào đang thực hiện. Hãy tạo mục tiêu mới hoặc chọn từ danh sách gợi ý!
                </div>
              )}
            </div>

            {/* Mục Tiêu Đã Đạt */}
            {achieved.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <h3 className="text-sm sm:text-base font-bold text-[#001D3D]">
                    Mục Tiêu Đã Hoàn Thành ({achieved.length})
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {achieved.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-3.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <Award size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{goal.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            Hoàn thành ngày: {goal.achieved_at || 'Đã ghi nhận'}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        100% Hoàn Thành
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHỤ: GỢI Ý & QUY TẮC (4 cột) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Gợi Ý Mục Tiêu Thông Minh */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-[#001D3D]">Gợi Ý Mục Tiêu Phù Hợp</h3>
              </div>

              {suggested.length > 0 ? (
                <div className="space-y-3">
                  {suggested.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 leading-tight">
                          {s.title}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                          Đạt {s.progress}%
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddSuggested(s)}
                        disabled={active.length >= settings.max_active_goals}
                        className="w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2F6FA8] font-bold text-[11px] transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} />
                        <span>Thêm Vào Kế Hoạch</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-3">
                  Hiện không có thêm gợi ý nào.
                </div>
              )}
            </div>

            {/* Quy Tắc Đặt Mục Tiêu */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#2F6FA8] font-bold text-xs">
                <AlertCircle size={15} />
                <span>Quy Tắc Rèn Luyện F&amp;B</span>
              </div>
              <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside font-medium leading-relaxed">
                <li>Tối đa 3 mục tiêu cùng lúc để giữ độ tập trung cao.</li>
                <li>Hệ thống tự động cập nhật % khi bạn hoàn thành ca hoặc bài kiểm tra.</li>
                <li>Đạt mục tiêu sẽ được cộng điểm thi đua vào bảng xếp hạng toàn chuỗi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
