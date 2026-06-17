import { Room, Booking } from '../types';
import { calculateDurationHours } from './dateUtils';

export const calculateBookingPrice = (
  room: Room,
  startTime: Date,
  endTime: Date,
  packagePrice: number = 0
): number => {
  const hours = calculateDurationHours(startTime, endTime);
  const roomPrice = hours * room.pricePerHour;
  return Math.round(roomPrice + packagePrice);
};

export const calculateExtraPrice = (
  room: Room,
  extraHours: number
): number => {
  return Math.round(extraHours * room.pricePerHour * 1.2);
};

export const calculateTotalPrice = (booking: Booking): number => {
  return booking.totalPrice + booking.extraPrice;
};

export const getRoomTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    small: '小包',
    medium: '中包',
    large: '大包',
    vip: 'VIP房',
    party: '派对房',
  };
  return labels[type] || type;
};

export const getBookingStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    arrived: '已到店',
    in_use: '使用中',
    completed: '已完成',
    cancelled: '已取消',
    extended: '已续钟',
  };
  return labels[status] || status;
};

export const getBookingStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500',
    confirmed: 'bg-blue-500',
    arrived: 'bg-cyan-500',
    in_use: 'bg-green-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
    extended: 'bg-purple-500',
  };
  return colors[status] || 'bg-gray-500';
};

export const getMemberLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    platinum: '铂金会员',
    diamond: '钻石会员',
  };
  return labels[level] || level;
};

export const getMemberLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    normal: 'text-gray-400 bg-gray-700',
    silver: 'text-slate-300 bg-slate-600',
    gold: 'text-amber-400 bg-amber-900',
    platinum: 'text-cyan-400 bg-cyan-900',
    diamond: 'text-purple-400 bg-purple-900',
  };
  return colors[level] || 'text-gray-400 bg-gray-700';
};

export const getQueueStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    waiting: '等待中',
    called: '已叫号',
    seated: '已入座',
    cancelled: '已取消',
    no_show: '未到店',
  };
  return labels[status] || status;
};
