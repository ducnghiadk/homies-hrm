'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Lock,
  Star,
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Skill, SkillUnlockCondition, SkillEndorsement } from '@/lib/career-path-types';
import { CareerIcon } from '@/lib/career-path-icon-helper';

interface SkillDetailModalProps {
  skill: Skill | null;
  status: 'locked' | 'in_progress' | 'unlocked';
  endorsements?: SkillEndorsement[];
  isOpen: boolean;
  onClose: () => void;
  onRequestUnlock?: (skillId: string) => void;
}

const categoryLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
  basic: {
    label: 'Kỹ Năng Cơ Bản',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  advanced: {
    label: 'Kỹ Năng Nâng Cao',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  management: {
    label: 'Kỹ Năng Quản Lý',
    bg: 'bg-blue-50',
    text: 'text-[#2F6FA8]',
    border: 'border-blue-200',
  },
};

export default function SkillDetailModal({
  skill,
  status,
  endorsements = [],
  isOpen,
  onClose,
  onRequestUnlock,
}: SkillDetailModalProps) {
  if (!isOpen || !skill) return null;

  const catStyle = categoryLabels[skill.category] || categoryLabels.basic;
  const isUnlocked = status === 'unlocked';
  const isInProgress = status === 'in_progress';
  const isLocked = status === 'locked';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100 shadow-2xs">
              <CareerIcon icon={skill.icon} size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#001D3D]">{skill.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                >
                  {catStyle.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Mã kỹ năng: {skill.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isUnlocked
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : isInProgress
                ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {isUnlocked && <CheckCircle2 size={16} className="text-emerald-600" />}
              {isInProgress && <Clock size={16} className="text-amber-600" />}
              {isLocked && <Lock size={16} className="text-gray-500" />}
              <span>
                {isUnlocked
                  ? 'Trạng thái: Đã hoàn thành & Đạt chuẩn'
                  : isInProgress
                  ? 'Trạng thái: Đang trong quá trình rèn luyện'
                  : 'Trạng thái: Chưa mở khóa'}
              </span>
            </div>
            {endorsements.length > 0 && (
              <span className="flex items-center gap-1 font-mono font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md text-[11px]">
                <Star size={12} className="fill-amber-500 text-amber-500" />
                {endorsements.length} bảo chứng
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#001D3D] uppercase text-[10px] tracking-wider text-gray-400">
              Mô Tả Nghiệp Vụ Quầy
            </span>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed font-medium">
              {skill.description || 'Chưa có mô tả chi tiết cho kỹ năng này.'}
            </div>
          </div>

          {/* Unlock Conditions */}
          <div className="space-y-2">
            <span className="font-bold text-[#001D3D] uppercase text-[10px] tracking-wider text-gray-400">
              Điều Kiện &amp; Tiêu Chuẩn Mở Khóa
            </span>
            {skill.unlock_conditions && skill.unlock_conditions.length > 0 ? (
              <div className="space-y-2">
                {skill.unlock_conditions.map((cond: SkillUnlockCondition, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-gray-100 bg-white flex items-center justify-between hover:bg-gray-50/50 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#2F6FA8] flex items-center justify-center">
                        {cond.type === 'months_worked' && <Calendar size={13} />}
                        {cond.type === 'kpi_min' && <TrendingUp size={13} />}
                        {cond.type === 'skills_required' && <BookOpen size={13} />}
                        {cond.type === 'approval' && <ShieldCheck size={13} />}
                        {cond.type === 'level_required' && <Award size={13} />}
                      </div>
                      <span className="font-medium text-gray-800">{cond.label}</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        isUnlocked
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isUnlocked ? 'Đã đạt' : 'Cần hoàn thành'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic text-[11px]">Không có điều kiện tiên quyết.</p>
            )}
          </div>

          {/* Endorsements / Bảo chứng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#001D3D] uppercase text-[10px] tracking-wider text-gray-400">
                Xác Nhận &amp; Bảo Chứng ({endorsements.length})
              </span>
            </div>
            {endorsements.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {endorsements.map((end) => (
                  <div
                    key={end.id}
                    className="p-2.5 bg-gray-50/70 border border-gray-100 rounded-xl flex items-start justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-[#2F6FA8] flex items-center justify-center font-bold text-xs">
                        <UserCheck size={14} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-xs">
                          {end.endorsed_by === 'emp-002'
                            ? 'Trần Thị Lan (Quản lý)'
                            : end.endorsed_by === 'emp-005'
                            ? 'Linh (Trợ lý QL)'
                            : 'Đồng nghiệp'}
                        </div>
                        {end.comment && (
                          <div className="text-gray-600 text-[11px] italic mt-0.5">
                            "{end.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 font-mono font-bold text-xs">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{end.rating}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-400 text-[11px]">
                Chưa có xác nhận bảo chứng nào cho kỹ năng này.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Đóng
          </button>
          {!isUnlocked && (
            <button
              onClick={() => {
                if (onRequestUnlock) onRequestUnlock(skill.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>{isInProgress ? 'Yêu Cầu Quản Lý Đánh Giá' : 'Đăng Ký Rèn Luyện Kỹ Năng'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
