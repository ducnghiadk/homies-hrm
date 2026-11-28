'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileWarning,
  Fingerprint,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';
import { GradientHeader } from './premium/GradientHeader';
import { getMondayOf, getShiftDisplay, toYmd } from '@/lib/scheduling/shift-display';
import {
  buildStoreToday,
  type PendingRequest,
  type RosterStatus,
  type StoreToday,
  type TodayAttendance,
  type TodaySchedule,
} from '@/lib/dashboard/store-today';

interface Props { user: { id: string; name: string; avatar?: string; storeId: string; storeName: string }; }

type RawData = {
  loaded: boolean;
  failed: boolean;
  weekPublished: boolean;
  nextWeekPublished: boolean;
  schedules: TodaySchedule[];
  attendance: TodayAttendance[];
  requests: PendingRequest[];
};

const EMPTY: RawData = {
  loaded: false, failed: false, weekPublished: true, nextWeekPublished: true, schedules: [], attendance: [], requests: [],
};

const STATUS_LABEL: Record<RosterStatus, { text: string; cls: string }> = {
  checked_in: { text: 'Đã vào ca', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_out: { text: 'Đã tan ca', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  late: { text: 'Đi trễ', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  not_yet: { text: 'Chưa tới giờ', cls: 'bg-white text-gray-500 border-gray-200' },
  absent: { text: 'Chưa chấm công', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const TASK_STYLE = {
  urgent: { icon: AlertTriangle, cls: 'border-red-200 bg-red-50', iconCls: 'text-red-600' },
  todo: { icon: ClipboardList, cls: 'border-amber-200 bg-amber-50', iconCls: 'text-amber-600' },
  ok: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50', iconCls: 'text-emerald-600' },
};

async function getJson(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Trang chủ quản lý cửa hàng: "Việc của quán hôm nay" từ dữ liệu thật. */
export function ManagerDashboardPremium({ user }: Props) {
  const [raw, setRaw] = useState<RawData>(EMPTY);
  const [reloadKey, setReloadKey] = useState(0);

  const dates = useMemo(() => {
    const now = new Date();
    const monday = getMondayOf(now);
    const next = new Date(monday);
    next.setDate(monday.getDate() + 7);
    return { today: toYmd(now), monday: toYmd(monday), nextMonday: toYmd(next), weekday: now.getDay() };
  }, []);

  useEffect(() => {
    let active = true;
    const store = encodeURIComponent(user.storeId);
    Promise.all([
      getJson(`/api/schedules?store_id=${store}&week_start=${dates.monday}&from_date=${dates.today}&to_date=${dates.today}&published_only=1&include_meta=0`),
      getJson(`/api/schedules?store_id=${store}&week_start=${dates.nextMonday}&from_date=${dates.nextMonday}&to_date=${dates.nextMonday}&include_meta=0`),
      getJson(`/api/attendance?store_id=${store}&date=${dates.today}`),
      getJson('/api/requests?status=pending'),
    ]).then(([week, nextWeek, att, req]) => {
      if (!active) return;
      const requests = Array.isArray(req?.data)
        ? (req.data as Array<PendingRequest & { store_id?: string }>).filter((r) => !r.store_id || r.store_id === user.storeId)
        : [];
      setRaw({
        loaded: true,
        failed: !week && !att,
        weekPublished: Boolean(week?.is_week_published),
        nextWeekPublished: Boolean(nextWeek?.is_week_published),
        schedules: Array.isArray(week?.data) ? week.data : [],
        attendance: Array.isArray(att?.data) ? att.data : [],
        requests,
      });
    });
    return () => { active = false; };
  }, [user.storeId, dates, reloadKey]);

  const today: StoreToday | null = useMemo(() => {
    if (!raw.loaded) return null;
    const now = new Date();
    return buildStoreToday({
      nowMinutes: now.getHours() * 60 + now.getMinutes(),
      isWeekPublished: raw.weekPublished,
      isNextWeekPublished: raw.nextWeekPublished,
      weekday: dates.weekday,
      schedules: raw.schedules,
      attendance: raw.attendance,
      pendingRequests: raw.requests,
      getTiming: getShiftDisplay,
    });
  }, [raw, dates.weekday]);

  const quickLinks = [
    { href: '/schedule', label: 'Xếp lịch', icon: CalendarDays },
    { href: '/attendance', label: 'Chấm công', icon: Fingerprint },
    { href: '/requests', label: 'Duyệt đơn', icon: ClipboardList, badge: raw.requests.length },
    { href: '/kpi/violations', label: 'Ghi sự cố', icon: FileWarning },
    { href: '/employees', label: 'Nhân sự', icon: Users },
    { href: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: 'store_manager', subtitle: user.storeName }}
        gradient="from-[#2F6FA8] to-[#001D3D]"
      />

      <div className="px-4 py-6 -mt-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Việc cần làm */}
            <section className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#001D3D]">Việc của quán hôm nay</h2>
                  <p className="text-sm text-gray-500">Làm lần lượt từ trên xuống. Số liệu lấy từ lịch đã chốt và chấm công thật.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                  aria-label="Tải lại"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {!today && <p className="py-6 text-center text-sm text-gray-400">Đang tải...</p>}
                {raw.failed && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Không tải được dữ liệu từ máy chủ. Bấm nút tải lại ở góc phải.
                  </p>
                )}
                {today?.tasks.map((task) => {
                  const style = TASK_STYLE[task.level];
                  const Icon = style.icon;
                  return (
                    <Link
                      key={task.id}
                      href={task.href}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition hover:shadow-sm ${style.cls}`}
                    >
                      <Icon size={20} className={`shrink-0 ${style.iconCls}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#001D3D]">{task.title}</p>
                        <p className="text-sm text-gray-600">{task.detail}</p>
                      </div>
                      <span className="hidden shrink-0 text-sm font-semibold text-[#2F6FA8] sm:inline">{task.cta}</span>
                      <ChevronRight size={18} className="shrink-0 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Ai đang làm hôm nay */}
            <section className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#001D3D]">Ca làm hôm nay</h2>
                {today && (
                  <span className="text-sm text-gray-500">
                    {today.counts.checkedIn}/{today.counts.scheduled} người đã vào ca
                  </span>
                )}
              </div>
              {today && today.roster.length === 0 && (
                <p className="mt-3 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  {raw.weekPublished
                    ? 'Hôm nay không có ai trong lịch đã chốt.'
                    : 'Lịch tuần này chưa chốt nên chưa có danh sách ca hôm nay.'}
                </p>
              )}
              <div className="mt-3 divide-y divide-gray-100">
                {today?.roster.map((r) => {
                  const label = STATUS_LABEL[r.status];
                  return (
                    <div key={r.scheduleId} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{r.employeeName}</p>
                        <p className="text-xs text-gray-500">{r.shiftName} · {r.timeRange}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${label.cls}`}>
                        {label.text}{r.status === 'late' && r.lateMinutes > 0 ? ` ${r.lateMinutes} phút` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-6 lg:mt-0 space-y-6">
            {today && (
              <section className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs">
                <h2 className="font-bold text-[#001D3D]">Tóm tắt hôm nay</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label="Người có ca" value={today.counts.scheduled} />
                  <Stat label="Đã vào ca" value={today.counts.checkedIn} />
                  <Stat label="Đi trễ" value={today.counts.late} tone={today.counts.late > 0 ? 'warn' : undefined} />
                  <Stat label="Chưa chấm công" value={today.counts.absent} tone={today.counts.absent > 0 ? 'bad' : undefined} />
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs">
              <h2 className="font-bold text-[#001D3D]">Đi nhanh</h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {quickLinks.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link
                      key={q.href}
                      href={q.href}
                      className="relative flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-[#FFF8E8]/60 px-2 py-3 text-center text-xs font-medium text-[#001D3D] hover:border-[#2F6FA8]/40"
                    >
                      <Icon size={20} className="text-[#2F6FA8]" />
                      {q.label}
                      {q.badge ? (
                        <span className="absolute right-1.5 top-1.5 min-w-5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-5 text-white">
                          {q.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'bad' }) {
  const color = tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-[#001D3D]';
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
