'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  initCareerPathStores,
  getActiveLevels,
  checkPromotionEligibility,
  getPromotionRequests,
  createPromotionRequest,
} from '@/lib/career-path-service';
import type { CareerLevel, PromotionConditionProgress, PromotionRequest } from '@/lib/career-path-types';
import ProgressRing from '@/components/career-path/ProgressRing';
import ProgressBar from '@/components/career-path/ProgressBar';
import { CareerIcon } from '@/lib/career-path-icon-helper';
import {
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Send,
  AlertCircle,
  FileCheck,
  XCircle,
} from 'lucide-react';

export default function PromotionPage() {
  const [levels] = useState<CareerLevel[]>(() => {
    initCareerPathStores();
    return getActiveLevels();
  });
  const [requests, setRequests] = useState<PromotionRequest[]>(() => getPromotionRequests());
  const [submitted, setSubmitted] = useState(false);

  const currentLevelId = 'level-staff';
  const empId = 'emp-001';

  const currentLevel = levels.find((l) => l.id === currentLevelId);
  const curIdx = levels.findIndex((l) => l.id === currentLevelId);
  const nextLevel = curIdx >= 0 && curIdx < levels.length - 1 ? levels[curIdx + 1] : null;

  const conditions: PromotionConditionProgress[] = nextLevel
    ? checkPromotionEligibility(empId, currentLevelId, nextLevel.id)
    : [];

  const allMet = conditions.length > 0 && conditions.every((c) => c.is_met);
  const overallProgress =
    conditions.length > 0
      ? Math.round(conditions.reduce((s, c) => s + c.progress_percent, 0) / conditions.length)
      : 0;

  const hasPending = requests.some((r) => r.employee_id === empId && r.status === 'pending');
  const myRequests = requests.filter((r) => r.employee_id === empId);

  const handleSubmit = () => {
    if (nextLevel && !hasPending) {
      createPromotionRequest(empId, currentLevelId, nextLevel.id, conditions);
      setRequests(getPromotionRequests());
      setSubmitted(true);
    }
  };

  return (
    <AppShell title="Xét Thăng Cấp">
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
                <span className="text-[#2F6FA8] font-bold">Xét Duyệt Thăng Cấp</span>
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
                  Hồ Sơ Xét Duyệt &amp; Thăng Cấp Bậc
                </h1>
                {hasPending && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    ● Đang Chờ Ban Giám Đốc Phê Duyệt
                  </span>
                )}
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

        {/* Thẻ Hero Thăng Cấp (Executive Dark Navy) */}
        {currentLevel && nextLevel && (
          <div className="bg-gradient-to-br from-[#001D3D] via-[#0A2540] to-[#1E3A8A] rounded-2xl p-6 sm:p-8 text-white shadow-md border border-blue-900/30 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
                  <TrendingUp size={14} />
                  <span>Kế Hoạch Thăng Tiến Chuỗi Homies</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <CareerIcon icon={currentLevel.icon} size={20} className="text-blue-300" />
                    <span>{currentLevel.name}</span>
                  </div>

                  <ArrowRight size={20} className="text-blue-400" />

                  <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-sky-300">
                    <CareerIcon icon={nextLevel.icon} size={24} className="text-amber-400" />
                    <span>{nextLevel.name}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                  {nextLevel.description ||
                    'Cấp bậc mở khóa quyền hạn đào tạo nhân viên mới, ưu tiên xếp ca và tham gia quản trị chi nhánh.'}
                </p>
              </div>

              <div className="flex items-center justify-center bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
                <ProgressRing
                  value={overallProgress}
                  size={90}
                  strokeWidth={7}
                  color="#38BDF8"
                  bgColor="rgba(255, 255, 255, 0.15)"
                  textColor="text-white"
                />
                <div className="pl-4 text-left">
                  <div className="text-xs text-blue-200 font-medium">Tiêu Chuẩn Đạt</div>
                  <div className="text-xl font-bold text-white font-mono tabular-nums">
                    {conditions.filter((c) => c.is_met).length}/{conditions.length}
                  </div>
                  <div className="text-[11px] text-blue-300/80">điều kiện cần thiết</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bố Cục Tỷ Lệ Vàng (2/3 Cột Chính + 1/3 Cột Phụ) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ═══════════════════════════════════════════════════════ */}
          {/* CỘT CHÍNH (8 cột)                                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* Checklist Tiêu Chuẩn Thăng Cấp */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#2F6FA8]" />
                  <h3 className="text-base font-bold text-[#001D3D]">
                    Bảng Tiêu Chuẩn &amp; Định Mức Cần Đạt
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#2F6FA8] bg-blue-50 px-2.5 py-1 rounded-xl">
                  {conditions.filter((c) => c.is_met).length}/{conditions.length} Tiêu chuẩn
                </span>
              </div>

              <div className="space-y-3">
                {conditions.map((cond, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      cond.is_met
                        ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                        : 'bg-gray-50/70 border-gray-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {cond.is_met ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                            <Clock size={16} />
                          </div>
                        )}
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-gray-900">
                            {cond.condition.label}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            {cond.is_met
                              ? 'Đã đáp ứng đầy đủ định mức yêu cầu'
                              : 'Cần tiếp tục tích lũy thêm'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-mono font-bold tabular-nums ${
                            cond.is_met ? 'text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {cond.current_value} / {cond.condition.value}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cond.is_met
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cond.is_met ? 'Đạt' : 'Chưa đạt'}
                        </span>
                      </div>
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

            {/* Hành Động Gửi Yêu Cầu */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-[#001D3D]">
                Gửi Hồ Sơ Xét Duyệt Thăng Cấp
              </h3>

              {submitted || hasPending ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                  <Clock size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-sm">Hồ sơ đã được gửi thành công!</div>
                    <div className="leading-relaxed">
                      Yêu cầu thăng tiến lên <strong>{nextLevel?.name}</strong> đang được Quản lý Cửa hàng &amp; Ban Giám Đốc xem xét. Bạn sẽ nhận được thông báo ngay khi có kết quả.
                    </div>
                  </div>
                </div>
              ) : allMet ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Bạn đã đủ 100% điều kiện!</div>
                      <div className="text-xs text-emerald-800 mt-0.5">
                        Hãy gửi hồ sơ để Ban Quản Trị phê duyệt thăng cấp chính thức.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    <Send size={15} />
                    <span>Gửi Yêu Cầu Thăng Tiến</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-xs">
                    <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                    <span>
                      Bạn cần hoàn thành thêm <strong>{conditions.filter((c) => !c.is_met).length}</strong> điều kiện còn thiếu để mở nút gửi hồ sơ.
                    </span>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed flex-shrink-0"
                  >
                    Chưa Đủ Điều Kiện
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* CỘT PHỤ (4 cột)                                         */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quyền Lợi Khi Lên Cấp Mới */}
            {nextLevel && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-[#001D3D]">
                    Quyền Lợi Cấp {nextLevel.name}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {nextLevel.benefits && nextLevel.benefits.length > 0 ? (
                    nextLevel.benefits.map((b, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-blue-50/50 border border-blue-100/70 rounded-xl flex items-center gap-2.5 text-xs text-gray-800"
                      >
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                        <span className="font-medium">{b}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">Chưa có thông tin quyền lợi.</div>
                  )}
                </div>
              </div>
            )}

            {/* Lịch Sử Yêu Cầu Xét Duyệt */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileCheck size={16} className="text-[#2F6FA8]" />
                <h3 className="text-sm font-bold text-[#001D3D]">Lịch Sử Hồ Sơ ({myRequests.length})</h3>
              </div>

              {myRequests.length > 0 ? (
                <div className="space-y-2.5">
                  {myRequests.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#001D3D]">Thăng cấp lên {nextLevel?.name}</span>
                        <span
                          className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                            r.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status === 'approved'
                            ? 'Đã duyệt'
                            : r.status === 'rejected'
                            ? 'Từ chối'
                            : 'Đang xét'}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Ngày gửi: {r.submitted_at}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-3">
                  Chưa có lịch sử yêu cầu nào.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
