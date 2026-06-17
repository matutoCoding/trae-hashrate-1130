import { RecurringRule, Booking, RecurringFrequency } from '../types';
import {
  addDays,
  addWeeks,
  addMonths,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  parse,
} from 'date-fns';
import { generateId } from './dateUtils';

export const getFrequencyLabel = (frequency: RecurringFrequency): string => {
  const labels: Record<RecurringFrequency, string> = {
    weekly: '每周',
    biweekly: '每两周',
    monthly: '每月',
  };
  return labels[frequency];
};

export const getWeekdayNames = (weekdays: number[]): string => {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays.map((d) => names[d]).join('、');
};

export const generateRecurringDates = (
  rule: RecurringRule
): Date[] => {
  const { frequency, weekdays, startTime, startDate, occurrences, endDate } = rule;
  
  const dates: Date[] = [];
  let currentDate = startOfDay(new Date(startDate));
  
  const startTimeDate = parse(startTime, 'HH:mm', currentDate);
  
  let count = 0;
  const maxOccurrences = occurrences || 52;
  const maxEndDate = endDate || addMonths(currentDate, 12);
  
  while (dates.length < maxOccurrences && isBefore(currentDate, maxEndDate)) {
    const dayOfWeek = currentDate.getDay();
    
    if (weekdays.includes(dayOfWeek)) {
      const bookingDate = new Date(currentDate);
      bookingDate.setHours(startTimeDate.getHours(), startTimeDate.getMinutes());
      
      if (isAfter(bookingDate, new Date()) || isSameDay(bookingDate, new Date())) {
        dates.push(bookingDate);
        count++;
      }
    }
    
    switch (frequency) {
      case 'weekly':
        currentDate = addDays(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addDays(currentDate, 1);
        break;
      case 'monthly':
        currentDate = addDays(currentDate, 1);
        break;
      default:
        currentDate = addDays(currentDate, 1);
    }
  }
  
  return dates;
};

export const generateBookingsFromRule = (
  rule: RecurringRule,
  endTimeStr: string,
  pricePerHour: number,
  packagePrice: number = 0
): Booking[] => {
  const dates = generateRecurringDates(rule);
  const endHours = parseInt(endTimeStr.split(':')[0]);
  const endMinutes = parseInt(endTimeStr.split(':')[1]);
  const startHours = parseInt(rule.startTime.split(':')[0]);
  const startMinutes = parseInt(rule.startTime.split(':')[1]);
  const durationHours = (endHours - startHours) + (endMinutes - startMinutes) / 60;
  
  return dates.map((date) => {
    const endDate = new Date(date);
    endDate.setHours(endHours, endMinutes);
    
    const totalPrice = Math.round(durationHours * pricePerHour + packagePrice);
    
    return {
      id: generateId(),
      roomId: rule.roomId,
      customerId: rule.customerId,
      recurringRuleId: rule.id,
      startTime: date,
      endTime: endDate,
      status: 'confirmed' as const,
      packageId: rule.packageId,
      totalPrice,
      isRecurring: true,
      extraHours: 0,
      extraPrice: 0,
      peopleCount: 4,
    };
  });
};

export const getNextOccurrence = (rule: RecurringRule): Date | null => {
  const dates = generateRecurringDates(rule);
  return dates.length > 0 ? dates[0] : null;
};
