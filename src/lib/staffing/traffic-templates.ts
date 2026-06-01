import { TrafficSlot } from './types';

export function getDefaultTrafficPattern(): TrafficSlot[] {
  return [
    { label: '7h - 9h', startHour: 7, endHour: 9, percentage: 10, level: 'low' },
    { label: '9h - 11h', startHour: 9, endHour: 11, percentage: 5, level: 'low' },
    { label: '11h - 14h', startHour: 11, endHour: 14, percentage: 30, level: 'high' },
    { label: '14h - 17h', startHour: 14, endHour: 17, percentage: 10, level: 'medium' },
    { label: '17h - 21h', startHour: 17, endHour: 21, percentage: 35, level: 'high' },
    { label: '21h - 23h', startHour: 21, endHour: 23, percentage: 10, level: 'low' },
  ];
}

export function getBubbleTeaTemplate(): TrafficSlot[] {
  // Bubble tea often peaks late afternoon/evening
  return [
    { label: '7h - 9h', startHour: 7, endHour: 9, percentage: 5, level: 'low' },
    { label: '9h - 11h', startHour: 9, endHour: 11, percentage: 10, level: 'low' },
    { label: '11h - 14h', startHour: 11, endHour: 14, percentage: 20, level: 'medium' },
    { label: '14h - 17h', startHour: 14, endHour: 17, percentage: 15, level: 'medium' },
    { label: '17h - 21h', startHour: 17, endHour: 21, percentage: 40, level: 'high' },
    { label: '21h - 23h', startHour: 21, endHour: 23, percentage: 10, level: 'low' },
  ];
}

export function getCafeTemplate(): TrafficSlot[] {
  // Cafe peaks morning
  return [
    { label: '7h - 9h', startHour: 7, endHour: 9, percentage: 30, level: 'high' },
    { label: '9h - 11h', startHour: 9, endHour: 11, percentage: 20, level: 'medium' },
    { label: '11h - 14h', startHour: 11, endHour: 14, percentage: 15, level: 'medium' },
    { label: '14h - 17h', startHour: 14, endHour: 17, percentage: 15, level: 'medium' },
    { label: '17h - 21h', startHour: 17, endHour: 21, percentage: 15, level: 'medium' },
    { label: '21h - 23h', startHour: 21, endHour: 23, percentage: 5, level: 'low' },
  ];
}
