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
  const startTimeDate = parse(startTime, 'HH:mm', new Date());
  const startHours = startTimeDate.getHours();
  const startMinutes = startTimeDate.getMinutes();
  
  let currentDate = startOfDay(new Date(startDate));
  let count = 0;
  const maxOccurrences = occurrences || 52;
  const maxEndDate = endDate || addMonths(currentDate, 12);
  const today = startOfDay(new Date());
  
  const advanceToNextPeriod = (date: Date): Date => {
    switch (frequency) {
      case 'weekly':
        return addDays(date, 1);
      case 'biweekly':
        return addDays(date, 1);
      case 'monthly':
        return addDays(date, 1);
      default:
        return addDays(date, 1);
    }
  };
  
  const processCurrentDate = () => {
    const dayOfWeek = currentDate.getDay();
    
    if (weekdays.includes(dayOfWeek)) {
      const bookingDate = new Date(currentDate);
      bookingDate.setHours(startHours, startMinutes, 0, 0);
      
      if (!isBefore(bookingDate, today) || isSameDay(bookingDate, today)) {
        dates.push(bookingDate);
        count++;
        
        if (frequency === 'biweekly') {
          currentDate = addDays(currentDate, 7);
        } else if (frequency === 'monthly') {
          currentDate = addMonths(currentDate, 1);
          currentDate.setDate(startDate.getDate());
        }
      }
    }
  };
  
  if (frequency === 'weekly') {
    while (dates.length < maxOccurrences && isBefore(currentDate, maxEndDate)) {
      processCurrentDate();
      currentDate = advanceToNextPeriod(currentDate);
    }
  } else if (frequency === 'biweekly') {
    while (dates.length < maxOccurrences && isBefore(currentDate, maxEndDate)) {
      const startOfWeekDate = new Date(currentDate);
      let foundInWeek = false;
      
      for (let i = 0; i < 7; i++) {
        const checkDate = addDays(startOfWeekDate, i);
        if (isBefore(checkDate, maxEndDate) && weekdays.includes(checkDate.getDay())) {
          const bookingDate = new Date(checkDate);
          bookingDate.setHours(startHours, startMinutes, 0, 0);
          
          if (!isBefore(bookingDate, today) || isSameDay(bookingDate, today)) {
            dates.push(bookingDate);
            count++;
          }
          foundInWeek = true;
        }
      }
      
      currentDate = addDays(startOfWeekDate, 14);
      if (!foundInWeek && dates.length === 0) {
        currentDate = addDays(startOfWeekDate, 1);
      }
    }
  } else if (frequency === 'monthly') {
    while (dates.length < maxOccurrences && isBefore(currentDate, maxEndDate)) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      for (const weekday of weekdays.sort((a, b) => a - b)) {
        const weekOfMonth = Math.floor((startDate.getDate() - 1) / 7);
        let targetDate = new Date(year, month, 1);
        const firstDayOfMonth = targetDate.getDay();
        let dayDiff = weekday - firstDayOfMonth;
        if (dayDiff < 0) dayDiff += 7;
        
        targetDate.setDate(1 + dayDiff + weekOfMonth * 7);
        
        if (targetDate.getMonth() !== month) {
          targetDate = new Date(year, month, 1);
          dayDiff = weekday - firstDayOfMonth;
          if (dayDiff < 0) dayDiff += 7;
          targetDate.setDate(1 + dayDiff);
        }
        
        if (isBefore(targetDate, maxEndDate)) {
          const bookingDate = new Date(targetDate);
          bookingDate.setHours(startHours, startMinutes, 0, 0);
          
          if (!isBefore(bookingDate, today) || isSameDay(bookingDate, today)) {
            dates.push(bookingDate);
            count++;
          }
        }
      }
      
      currentDate = addMonths(currentDate, 1);
    }
  }
  
  return dates.slice(0, maxOccurrences);
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
  
  let startTotal = startHours * 60 + startMinutes;
  let endTotal = endHours * 60 + endMinutes;
  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }
  const durationHours = (endTotal - startTotal) / 60;
  
  return dates.map((date) => {
    const endDate = new Date(date);
    endDate.setHours(endHours, endMinutes);
    if (endTotal >= 24 * 60) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
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
