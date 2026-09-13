'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  initCareerPathStores,
  getSkills,
  getEmployeeSkills,
  getSkillLevels,
  getEmployeeSkillLevel,
  getSkillEndorsements,
} from '@/lib/career-path-service';
import type { Skill, EmployeeSkill, SkillCategory, SkillEndorsement } from '@/lib/career-path-types';
import SkillHexagon from '@/components/career-path/SkillHexagon';
import SkillDetailModal from '@/components/career-path/SkillDetailModal';
import { CareerIcon } from '@/lib/career-path-icon-helper';
import {
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Lock,
  Star,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type FilterCategory = 'all' | SkillCategory;

export default function SkillsPage() {
  const [skills] = useState<Skill[]>(() => {
    initCareerPathStores();
    return getSkills().filter((s) => s.is_active);
  });
  const [empSkills] = useState<EmployeeSkill[]>(() => getEmployeeSkills('emp-001'));
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [skillLevel] = useState(() => getEmployeeSkillLevel('emp-001'));

  const allEndorsements = getSkillEndorsements('emp-001');

  const filtered = filter === 'all' ? skills : skills.filter((s) => s.category === filter);
  const getStatus = (sid: string) => empSkills.find((es) => es.skill_id === sid)?.status || 'locked';
  const getEmpSkill = (sid: string) => empSkills.find((es) => es.skill_id === sid);
  const unlocked = empSkills.filter((es) => es.status === 'unlocked').length;

  const categories: { key: FilterCategory; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: skills.length },
    { key: 'basic', label: 'Cơ bản', count: skills.filter((s) => s.category === 'basic').length },
    { key: 'advanced', label: 'Nâng cao', count: skills.filter((s) => s.category === 'advanced').length },
    { key: 'management', label: 'Quản lý', count: skills.filter((s) => s.category === 'management').length },
  ];

  const skillLevels = getSkillLevels();

  const handleOpenSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsDetailOpen(true);
  };

  const selectedSkillStatus = selectedSkill ? getStatus(selectedSkill.id) : 'locked';
  const selectedSkillEndorsements = selectedSkill
    ? allEndorsements.filter((e: SkillEndorsement) => e.skill_id === selectedSkill.id)
    : [];

  return (
    <AppShell title="Danh Mục Kỹ Năng">
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
                <span className="text-[#2F6FA8] font-bold">Danh Mục Kỹ Năng</span>
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
                  Danh Mục Kỹ Năng &amp; Tiêu Chuẩn Quầy
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#2F6FA8] border border-blue-200">
                  Skill Level {skillLevel} • {unlocked}/{skills.length} Đã Mở
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#2F6FA8] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Xem lưới lục giác"
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Lưới</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    viewMode === 'list'
                      ? 'bg-white text-[#2F6FA8] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Xem danh sách chi tiết"
                >
                  <List size={15} />
                  <span className="hidden sm:inline">Danh sách</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dải 4 Cấp Độ Kỹ Năng (Skill Levels Tier) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {skillLevels.map((sl) => {
            const isCurrentOrPassed = skillLevel >= sl.level;
            return (
              <div
                key={sl.level}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrentOrPassed
                    ? 'bg-white border-blue-200 shadow-xs'
                    : 'bg-gray-50/60 border-gray-200/60 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Cấp {sl.level}</span>
                  {isCurrentOrPassed ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Đã đạt
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                      Chưa đạt
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-[#001D3D] mt-1.5 flex items-center gap-1.5">
                  <CareerIcon icon={sl.icon} size={15} className="text-[#2F6FA8]" />
                  <span>{sl.label}</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Yêu cầu: ≥ {sl.min_advanced_skills} kỹ năng nâng cao
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filter === c.key
                      ? 'bg-[#2F6FA8] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      filter === c.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Hiển thị <strong className="text-[#001D3D]">{filtered.length}</strong> / {skills.length} kỹ năng
            </div>
          </div>

          {/* VIEW: GRID (Lưới lục giác) */}
          {viewMode === 'grid' && (
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start pt-4 border-t border-gray-100">
              {filtered.map((skill) => (
                <SkillHexagon
                  key={skill.id}
                  icon={skill.icon}
                  name={skill.name}
                  status={getStatus(skill.id)}
                  category={skill.category}
                  size={76}
                  onClick={() => handleOpenSkill(skill)}
                  endorsementCount={getEmpSkill(skill.id)?.endorsement_count}
                />
              ))}
            </div>
          )}

          {/* VIEW: LIST (Bảng danh sách chi tiết) */}
          {viewMode === 'list' && (
            <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
              {filtered.map((skill) => {
                const status = getStatus(skill.id);
                const empSkill = getEmpSkill(skill.id);
                const isUnlocked = status === 'unlocked';
                const isInProgress = status === 'in_progress';
                const isLocked = status === 'locked';

                return (
                  <div
                    key={skill.id}
                    onClick={() => handleOpenSkill(skill)}
                    className="py-3.5 px-3 rounded-xl flex items-center justify-between hover:bg-blue-50/30 transition cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isUnlocked
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInProgress
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isLocked ? <Lock size={18} /> : <CareerIcon icon={skill.icon} size={20} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[#001D3D] truncate">
                            {skill.name}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              skill.category === 'basic'
                                ? 'bg-emerald-50 text-emerald-700'
                                : skill.category === 'advanced'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-blue-50 text-[#2F6FA8]'
                            }`}
                          >
                            {skill.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {skill.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {empSkill?.endorsement_count ? (
                        <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span>{empSkill.endorsement_count}</span>
                        </span>
                      ) : null}

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                          isUnlocked
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInProgress
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isUnlocked && <CheckCircle2 size={12} />}
                        {isInProgress && <Clock size={12} />}
                        {isLocked && <Lock size={12} />}
                        <span>{isUnlocked ? 'Đã đạt' : isInProgress ? 'Đang học' : 'Chưa mở'}</span>
                      </span>

                      <button className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs hover:bg-[#2F6FA8] hover:text-white transition">
                        Chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT KỸ NĂNG */}
      <SkillDetailModal
        skill={selectedSkill}
        status={selectedSkillStatus}
        endorsements={selectedSkillEndorsements}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRequestUnlock={(skillId) => {
          alert(`Đã gửi yêu cầu đăng ký rèn luyện kỹ năng: ${skillId}`);
        }}
      />
    </AppShell>
  );
}
