'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Fingerprint,
  Plane,
  RefreshCw,
  UserRound,
  Wallet,
} from 'lucide-react';
import { GradientHeader } from './premium/GradientHeader';
import { useAuthStore } from '@/store/auth-store';
import { getMondayOf, getShiftDisplay, toYmd } from '@/lib/scheduling/shift-display';

interface Props {
  user: { id: string; name: string; avatar?: string; level: string };
}

type WeekShift = { id: string; date: string; shift_id?: string; shift_name?: string; notes?: string };
type Deadline = { enabled: boolean; date?: string; time?: string; passed?: boolean } | null;

type HomeData = {
  loaded: boolean;
  weekPublished: boolean;
  shifts: WeekShift[];
  nextWeekPublished: boolean;
  deadline: Deadline;
  pendingRequests: number;
};

const EMPTY: HomeData = { loaded: false, weekPublished: false, shifts: [], nextWeekPublished: false, deadline: null, pendingRequests: 0 };

const weekdayLong = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' });
const dayMonth = { format: (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` };

async function getJson(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Trang chủ của nhân viên / trưởng ca: chỉ những việc cần biết hôm nay. */
export function EmployeeDashboardPremium({ user }: Props) {
  const storeId = useAuthStore((s) => s.user?.store_id);
  const [data, setData] = useState<HomeData>(EMPTY);

  const { today, weekDays, nextMonday } = useMemo(() => {
    const now = new Date();
    const monday = getMondayOf(now);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const next = new Date(monday);
    next.setDate(monday.getDate() + 7);
    return { today: toYmd(now), weekDays: days, nextMonday: toYmd(next) };
  }, []);

  useEffect(() => {
    let active = true;
    const from = toYmd(weekDays[0]);
    const to = toYmd(weekDays[6]);
    const scheduleParams = new URLSearchParams({
      employee_id: user.id, from_date: from, to_date: to, week_start: from, published_only: '1', include_meta: '1',
    });
    const registerParams = new URLSearchParams({ store_id: storeId || '', week: nextMonday, status: 'all' });

    Promise.all([
      getJson(`/api/schedules?${scheduleParams.toString()}`),
      storeId ? getJson(`/api/shifts/register?${registerParams.toString()}`) : Promise.resolve(null),
      getJson('/api/requests?status=pending'),
    ]).then(([week, register, requests]) => {
      if (!active) return;
      const weekPublished = Boolean(week?.is_week_published);
      const shifts: WeekShift[] = weekPublished && Array.isArray(week?.data)
        ? week.data.map((s: Record<string, unknown>) => ({
            id: String(s.id),
            date: String(s.date || '').slice(0, 10),
            shift_id: s.shift_id ? String(s.shift_id) : undefined,
            shift_name: s.shift_name ? String(s.shift_name) : undefined,
            notes: s.notes ? String(s.notes) : undefined,
          }))
        : [];
      setData({
        loaded: true,
        weekPublished,
        shifts,
        nextWeekPublished: register?.week_status === 'published',
        deadline: register?.availability_deadline || null,
        pendingRequests: Array.isArray(requests?.data) ? requests.data.length : 0,
      });
    });
    return () => {
      active = false;
    };
  }, [user.id, storeId, weekDays, nextMonday]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, WeekShift[]>();
    for (const s of data.shifts) {
      const list = map.get(s.date) || [];
      list.push(s);
      map.set(s.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => getShiftDisplay(a).startMinutes - getShiftDisplay(b).startMinutes);
    return map;
  }, [data.shifts]);

  const todayShifts = shiftsByDate.get(today) || [];

  const todos: { id: string; text: string; href: string }[] = [];
  if (data.loaded && !data.nextWeekPublished) {
    const d = data.deadline;
    if (d?.enabled && d.date && !d.passed) {
      const [, mm, dd] = d.date.split('-');
      todos.push({ id: 'avail', text: `Nộp lịch rảnh tuần sau trước ${d.time || ''} ngày ${dd}/${mm}`, href: '/shifts/register' });
    } else if (!d?.enabled) {
      todos.push({ id: 'avail', text: 'Đăng ký lịch rảnh tuần sau', href: '/shifts/register' });
    }
  }
  if (data.pendingRequests > 0) {
    todos.push({ id: 'req', text: `${data.pendingRequests} đơn của bạn đang chờ duyệt`, href: '/requests' });
  }

  const quickLinks = [
    { href: '/leave/request', label: 'Xin nghỉ', icon: Plane },
    { href: '/schedule/swap', label: 'Đổi ca', icon: RefreshCw },
    { href: '/payroll/salary-slip', label: 'Phiếu lương', icon: Wallet },
    { href: '/profile', label: 'Hồ sơ', icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <GradientHeader
        user={{ name: user.name, avatar: user.avatar, role: user.level }}
        gradient="from-[#2F6FA8] to-[#001D3D]"
        rightContent={
          <Link href="/notifications" aria-label="Thông báo" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30">
            <Bell size={18} />
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        {/* Hôm nay */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <p className="text-sm font-medium text-gray-500">
            Hôm nay · {weekdayLong.format(new Date())} {dayMonth.format(new Date())}
          </p>
          {!data.loaded ? (
            <p className="mt-2 text-base text-gray-500">Đang tải ca làm…</p>
          ) : !data.weekPublished ? (
            <p className="mt-2 text-lg font-semibold text-[#001D3D]">Quản lý chưa chốt lịch tuần này</p>
          ) : todayShifts.length === 0 ? (
            <p className="mt-2 text-lg font-semibold text-[#001D3D]">Hôm nay bạn không có ca làm</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {todayShifts.map((s) => {
                const info = getShiftDisplay(s);
                return (
                  <li key={s.id} className="text-lg font-semibold text-[#001D3D]">
                    {info.name} <span className="font-normal text-gray-600">· {info.timeRange}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/checkin"
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#2F6FA8] text-base font-semibold text-white hover:bg-[#245a8a]"
          >
            <Fingerprint size={22} /> Chấm công vào ca / tan ca
          </Link>
        </section>

        {/* Việc cần làm */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#001D3D]">
            <ClipboardList size={18} className="text-[#2F6FA8]" /> Việc cần làm
          </h2>
          {todos.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">{data.loaded ? 'Không có việc gì cần làm. Tốt lắm!' : 'Đang kiểm tra…'}</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {todos.map((t) => (
                <li key={t.id}>
                  <Link href={t.href} className="flex items-center justify-between py-3 text-sm font-medium text-gray-800 hover:text-[#2F6FA8]">
                    {t.text} <ChevronRight size={16} className="text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lịch tuần này */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#001D3D]">
              <CalendarDays size={18} className="text-[#2F6FA8]" /> Lịch tuần này
            </h2>
            <Link href="/my-schedule" className="text-sm font-medium text-[#2F6FA8]">Xem chi tiết</Link>
          </div>
          {data.loaded && !data.weekPublished ? (
            <p className="mt-2 text-sm text-gray-500">Lịch sẽ hiện ở đây khi quản lý chốt.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {weekDays.map((d) => {
                const ymd = toYmd(d);
                const list = shiftsByDate.get(ymd) || [];
                const isToday = ymd === today;
                return (
                  <li key={ymd} className={`flex items-start justify-between gap-3 py-2.5 text-sm ${isToday ? 'font-semibold text-[#001D3D]' : 'text-gray-700'}`}>
                    <span className="w-28 shrink-0">{weekdayLong.format(d)} {dayMonth.format(d)}</span>
                    <span className="text-right">
                      {list.length === 0
                        ? <span className="text-gray-400">Nghỉ</span>
                        : list.map((s) => {
                            const info = getShiftDisplay(s);
                            return <span key={s.id} className="block">{info.name} · {info.timeRange}</span>;
                          })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Lối tắt */}
        <section className="grid grid-cols-4 gap-2">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white py-3 text-xs font-medium text-gray-700 shadow-xs hover:text-[#2F6FA8]">
              <Icon size={20} className="text-[#2F6FA8]" />
              {label}
            </Link>
          ))}
        </section>
      </div>

      <div className="h-24" />
    </div>
  );
}
