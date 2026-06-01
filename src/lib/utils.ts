import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // radius of Earth in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  if (typeof date === "string") {
    const normalizedTime = date.trim();
    if (/^\d{1,2}:\d{2}$/.test(normalizedTime)) {
      return normalizedTime;
    }
  }

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return typeof date === "string" ? date : "";
  }

  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

/**
 * Format hours to display
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "on_time":
      return "badge-success";
    case "late":
      return "badge-error";
    case "early":
      return "badge-warning";
    case "absent":
      return "badge-error";
    case "pending":
      return "badge-warning";
    case "approved":
      return "badge-success";
    case "rejected":
      return "badge-error";
    default:
      return "badge-primary";
  }
}

/**
 * Get status label in Vietnamese
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "on_time":
      return "Đúng giờ";
    case "late":
      return "Trễ";
    case "early":
      return "Sớm";
    case "absent":
      return "Vắng";
    case "pending":
      return "Chờ duyệt";
    case "approved":
      return "Đã duyệt";
    case "rejected":
      return "Từ chối";
    case "active":
      return "Đang làm";
    case "inactive":
      return "Nghỉ việc";
    case "probation":
      return "Thử việc";
    default:
      return status;
  }
}
