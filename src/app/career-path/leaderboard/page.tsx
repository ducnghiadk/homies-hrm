'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { initCareerPathStores, getLeaderboard } from '@/lib/career-path-service';
import type { LeaderboardEntry, LeaderboardCategory } from '@/lib/career-path-types';
import {
  ChevronRight,
  ArrowLeft,
  Trophy,
  Award,
  Medal,
  Users,
  Sparkles,
  Flame,
  Coffee,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Crown,
} from 'lucide-react';

const categories: { key: LeaderboardCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'top_mentor', label: 'Top Mentor', icon: <Users size={16} />, desc: 'Số lượng mentee hoàn thành xuất sắc' },
  { key: 'skill_unlock', label: 'Bậc Thầy Kỹ Năng', icon: <Sparkles size={16} />, desc: 'Số kỹ năng đã mở khóa trong ma trận' },
  { key: 'streak', label: 'Chuỗi Ngày Hoàn Hảo', icon: <Flame size={16} />, desc: 'Số ca làm liên tục không vi phạm' },
  { key: 'drinks_made', label: 'Sản Lượng Pha Chế', icon: <Coffee size={16} />, desc: 'Tổng số ly đồ uống phục vụ chuẩn vị' },
];

export default function LeaderboardPage() {
  const [cat, setCat] = useState<LeaderboardCategory>('top_mentor');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const period = '2026-02';

  useEffect(() => {
    initCareerPathStores();
  }, []);

  useEffect(() => {
    setEntries(getLeaderboard(cat, period));
  }, [cat]);

  const activeCategoryInfo = categories.find((c) => c.key === cat) || categories[0];

  return (
    <AppShell title="Bảng Xếp Hạng Thi Đua">
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
                <span className="text-[#2F6FA8] font-bold">Bảng Xếp Hạng</span>
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
                  Bảng Xếp Hạng Thi Đua &amp; Vinh Danh
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Calendar size={11} />
                  <span>Kỳ: Tháng 02/2026</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/career-path"
                className="px-3.5 py-1.5 min-h-[36px] rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 transition shadow-2xs"
              >
                <span>Về Trang Cá Nhân</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Category Tabs (Hạng Mục Thi Đua) */}
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((c) => {
              const isActive = cat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={`p-3 rounded-xl text-left transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-[#2F6FA8] text-white shadow-xs'
                      : 'bg-gray-50/70 text-gray-700 hover:bg-gray-100/80'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2F6FA8]'
                    }`}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{c.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${
                        isActive ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {c.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* BỤC VINH DANH TOP 3 (EXECUTIVE PODIUM)                    */}
        {/* ───────────────────────────────────────────────────────── */}
        {entries.length >= 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8">
            <div className="text-center max-w-md mx-auto mb-8">
              <span className="text-xs font-bold text-[#2F6FA8] uppercase tracking-wider">
                Bục Vinh Danh Xuất Sắc
              </span>
              <h2 className="text-lg font-bold text-[#001D3D] mt-1">
                Top 3 Ngôi Sao {activeCategoryInfo.label}
              </h2>
            </div>

            <div className="flex justify-center items-end gap-3 sm:gap-6 max-w-2xl mx-auto pt-4">
              {/* HẠNG 2 (BẠC - BÊN TRÁI) */}
              <div className="flex-1 text-center flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-700 font-bold text-lg shadow-xs">
                    {entries[1].employee_name[0]}
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                    <Medal size={14} />
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-bold text-[#001D3D] truncate max-w-[120px]">
                  {entries[1].employee_name}
                </div>
                <div className="text-lg sm:text-xl font-mono font-bold text-slate-700 tabular-nums mt-0.5">
                  {entries[1].score}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Chi nhánh Q.1</div>

                {/* Bục Bạc */}
                <div className="w-full h-24 sm:h-28 bg-gradient-to-b from-slate-200/90 via-slate-100 to-white rounded-t-2xl border-t-4 border-slate-400 mt-3 flex items-center justify-center shadow-inner">
                  <span className="text-2xl font-mono font-bold text-slate-400">2</span>
                </div>
              </div>

              {/* HẠNG 1 (VÀNG HOÀNG KIM - Ở GIỮA, CAO NHẤT) */}
              <div className="flex-1 text-center flex flex-col items-center -translate-y-2">
                <div className="relative mb-3">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                    <Crown size={22} className="fill-amber-400 text-amber-500" />
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-3 border-amber-400 flex items-center justify-center text-amber-900 font-bold text-xl shadow-md">
                    {entries[0].employee_name[0]}
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-amber-950 font-bold text-xs shadow-xs">
                    <Trophy size={16} />
                  </div>
                </div>

                <div className="text-sm sm:text-base font-bold text-[#001D3D] truncate max-w-[140px]">
                  {entries[0].employee_name}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-600 tabular-nums mt-0.5">
                  {entries[0].score}
                </div>
                {entries[0].highlight && (
                  <div className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full mt-1 truncate max-w-[140px]">
                    {entries[0].highlight}
                  </div>
                )}

                {/* Bục Vàng */}
                <div className="w-full h-36 sm:h-40 bg-gradient-to-b from-amber-200 via-amber-100/70 to-white rounded-t-2xl border-t-4 border-amber-400 mt-3 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-mono font-bold text-amber-600">1</span>
                </div>
              </div>

              {/* HẠNG 3 (ĐỒNG - BÊN PHẢI) */}
              <div className="flex-1 text-center flex flex-col items-center">
                <div className="relative mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-50 border-2 border-orange-300 flex items-center justify-center text-orange-800 font-bold text-lg shadow-xs">
                    {entries.length > 2 ? entries[2].employee_name[0] : '-'}
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-orange-300 border-2 border-white flex items-center justify-center text-orange-950 font-bold text-xs shadow-2xs">
                    <Award size={14} />
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-bold text-[#001D3D] truncate max-w-[120px]">
                  {entries.length > 2 ? entries[2].employee_name : '-'}
                </div>
                <div className="text-lg sm:text-xl font-mono font-bold text-orange-800 tabular-nums mt-0.5">
                  {entries.length > 2 ? entries[2].score : 0}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Chi nhánh Q.1</div>

                {/* Bục Đồng */}
                <div className="w-full h-16 sm:h-20 bg-gradient-to-b from-orange-200/70 via-orange-100/50 to-white rounded-t-2xl border-t-4 border-orange-400 mt-3 flex items-center justify-center shadow-inner">
                  <span className="text-2xl font-mono font-bold text-orange-400">3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* BẢNG XẾP HẠNG TOÀN BỘ (DATA TABLE)                       */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#001D3D]">
              Bảng Tổng Sắp Hạng Toàn Chuỗi ({entries.length} Nhân Sự)
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Cập nhật lúc 23:00 hàng ngày
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {entries.map((entry, index) => {
              const isTop1 = index === 0;
              const isTop2 = index === 1;
              const isTop3 = index === 2;

              return (
                <div
                  key={entry.employee_id}
                  className={`p-4 flex items-center justify-between hover:bg-blue-50/20 transition-colors ${
                    isTop1 ? 'bg-amber-50/30' : isTop2 ? 'bg-slate-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center">
                      {isTop1 ? (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shadow-2xs border border-amber-300">
                          1
                        </div>
                      ) : isTop2 ? (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shadow-2xs border border-slate-300">
                          2
                        </div>
                      ) : isTop3 ? (
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-xs shadow-2xs border border-orange-300">
                          3
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-gray-400 text-sm">{index + 1}</span>
                      )}
                    </div>

                    {/* Avatar Initial */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isTop1
                          ? 'bg-amber-400 text-amber-950 shadow-2xs'
                          : 'bg-blue-50 text-[#2F6FA8]'
                      }`}
                    >
                      {entry.employee_name[0]}
                    </div>

                    {/* Employee Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#001D3D]">
                          {entry.employee_name}
                        </span>
                        {entry.highlight && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {entry.highlight}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        Mã NV: {entry.employee_id} • Chi nhánh Quận 1
                      </div>
                    </div>
                  </div>

                  {/* Score & Trend */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-mono font-bold tabular-nums text-[#001D3D]">
                        {entry.score}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">điểm thành tích</div>
                    </div>

                    <div className="w-6 flex justify-center">
                      {entry.trend === 'up' && (
                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-600" title="Tăng hạng">
                          <TrendingUp size={14} />
                        </div>
                      )}
                      {entry.trend === 'down' && (
                        <div className="p-1 rounded-md bg-rose-50 text-rose-600" title="Giảm hạng">
                          <TrendingDown size={14} />
                        </div>
                      )}
                      {entry.trend === 'same' && (
                        <div className="p-1 rounded-md bg-gray-100 text-gray-500" title="Giữ nguyên">
                          <Minus size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
