import { BusinessHours } from '../types';
import {
  startOfDay,
  setHours,
  setMinutes,
  addDays,
  isBefore,
  isAfter,
  differenceInMinutes,
  startOfWeek,
} from 'date-fns';

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  dayStartHour: 10,
  dayStartMinute: 0,
  dayEndHour: 3,
  dayEndMinute: 0,
  overnight: true,
};

let businessHoursConfig: BusinessHours = DEFAULT_BUSINESS_HOURS;

export const setBusinessHours = (hours: Partial<BusinessHours>) => {
  businessHoursConfig = { ...businessHoursConfig, ...hours };
};

export const getBusinessHours = (): BusinessHours => {
  return { ...businessHoursConfig };
};

export const getBusinessDayForDate = (datetime: Date): Date => {
  const { dayStartHour, dayStartMinute, overnight } = businessHoursConfig;
  const dayStart = setMinutes(setHours(startOfDay(datetime), dayStartHour), dayStartMinute);
  
  if (overnight) {
    const dayStartPrev = addDays(dayStart, -1);
    if (isBefore(datetime, dayStart) && isAfter(datetime, dayStartPrev)) {
      return startOfDay(dayStartPrev);
    }
  }
  
  return startOfDay(datetime);
};

export const getBusinessDayStart = (businessDay: Date): Date => {
  const { dayStartHour, dayStartMinute } = businessHoursConfig;
  return setMinutes(setHours(startOfDay(businessDay), dayStartHour), dayStartMinute);
};

export const getBusinessDayEnd = (businessDay: Date): Date => {
  const { dayEndHour, dayEndMinute, overnight } = businessHoursConfig;
  const endDate = overnight ? addDays(startOfDay(businessDay), 1) : startOfDay(businessDay);
  return setMinutes(setHours(endDate, dayEndHour), dayEndMinute);
};

export const getDisplayHours = (): number[] => {
  const { dayStartHour, dayEndHour, overnight } = businessHoursConfig;
  const hours: number[] = [];
  
  if (overnight) {
    const totalHours = (24 - dayStartHour) + dayEndHour;
    for (let i = 0; i < totalHours; i++) {
      hours.push((dayStartHour + i) % 24);
    }
  } else {
    for (let h = dayStartHour; h < dayEndHour; h++) {
      hours.push(h);
    }
  }
  
  return hours;
};

export const getDisplayHourLabels = (): string[] => {
  return getDisplayHours().map((h) => `${h}:00`);
};

export const getTotalDisplayHours = (): number => {
  return getDisplayHours().length;
};

export const getAbsoluteHourForDateTime = (datetime: Date, businessDay: Date): number => {
  const dayStart = getBusinessDayStart(businessDay);
  const totalMinutes = differenceInMinutes(datetime, dayStart);
  return totalMinutes / 60;
};

export const getDateTimeForAbsoluteHour = (businessDay: Date, absoluteHour: number): Date => {
  const dayStart = getBusinessDayStart(businessDay);
  const target = new Date(dayStart);
  target.setMinutes(target.getMinutes() + absoluteHour * 60);
  return target;
};

export const getBookingSegmentForBusinessDay = (
  startTime: Date,
  endTime: Date,
  businessDay: Date
): { start: Date; end: Date } | null => {
  const dayStart = getBusinessDayStart(businessDay);
  const dayEnd = getBusinessDayEnd(businessDay);
  
  if (startTime >= dayEnd || endTime <= dayStart) {
    return null;
  }
  
  return {
    start: startTime > dayStart ? startTime : dayStart,
    end: endTime < dayEnd ? endTime : dayEnd,
  };
};

export const getTimePositionPercent = (
  segmentStart: Date,
  segmentEnd: Date,
  businessDay: Date
): { left: number; width: number } => {
  const dayStart = getBusinessDayStart(businessDay);
  const dayEnd = getBusinessDayEnd(businessDay);
  
  const totalMinutes = differenceInMinutes(dayEnd, dayStart);
  const startOffset = differenceInMinutes(segmentStart, dayStart);
  const duration = differenceInMinutes(segmentEnd, segmentStart);
  
  const left = (startOffset / totalMinutes) * 100;
  const width = (duration / totalMinutes) * 100;
  
  return {
    left: Math.max(left, 0),
    width: Math.max(width, 0.5),
  };
};

export const isMidnightHour = (hour: number): boolean => {
  return hour >= 0 && hour < 6;
};

export const navigateBusinessDay = (currentBusinessDay: Date, direction: -1 | 1, mode: 'day' | 'week'): Date => {
  if (mode === 'day') {
    return addDays(currentBusinessDay, direction);
  } else {
    return addDays(currentBusinessDay, direction * 7);
  }
};

export const getWeekBusinessDays = (referenceDate: Date): Date[] => {
  const days: Date[] = [];
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  for (let i = 0; i < 7; i++) {
    days.push(addDays(monday, i));
  }
  return days;
};

export const formatPaymentMethod = (method: string): string => {
  const labels: Record<string, string> = {
    cash: '现金',
    wechat: '微信支付',
    alipay: '支付宝',
    card: '银行卡',
    points: '积分抵扣',
    credit: '挂账',
  };
  return labels[method] || method;
};
