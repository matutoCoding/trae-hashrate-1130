import {
  differenceInHours,
  differenceInMinutes,
  format,
  isSameDay,
  parse,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: Date, pattern: string = 'yyyy-MM-dd'): string => {
  return format(date, pattern, { locale: zhCN });
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm', { locale: zhCN });
};

export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}小时`;
  return `${wholeHours}小时${minutes}分钟`;
};

export const calculateDurationHours = (start: Date, end: Date): number => {
  return differenceInMinutes(end, start) / 60;
};

export const parseTimeString = (timeStr: string, baseDate: Date): Date => {
  return parse(timeStr, 'HH:mm', baseDate);
};

export const getWeekdayName = (weekday: number): string => {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[weekday];
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
};
