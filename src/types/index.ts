export type RoomType = 'small' | 'medium' | 'large' | 'vip' | 'party';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  pricePerHour: number;
  equipment: string[];
  status: 'active' | 'maintenance' | 'disabled';
  floor: number;
}

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  memberLevel: MemberLevel;
  isVip: boolean;
  points: number;
  avatar?: string;
  totalSpent: number;
  visitCount: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'extended';

export interface Booking {
  id: string;
  roomId: string;
  customerId: string;
  recurringRuleId?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  packageId?: string;
  totalPrice: number;
  isRecurring: boolean;
  extraHours: number;
  extraPrice: number;
  peopleCount: number;
  remarks?: string;
  cancelReason?: string;
  cancelTime?: Date;
  createdAt?: Date;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface RecurringRule {
  id: string;
  customerId: string;
  roomId: string;
  frequency: RecurringFrequency;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate?: Date;
  occurrences?: number;
  packageId?: string;
  isActive: boolean;
  customerName?: string;
  roomName?: string;
}

export type PackageCategory = 'beer' | 'wine' | 'spirit' | 'snack' | 'combo';

export interface PackageItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  items: PackageItem[];
  category: PackageCategory;
  image?: string;
}

export type QueueStatus = 'waiting' | 'called' | 'seated' | 'cancelled' | 'no_show';

export interface QueueItem {
  id: string;
  customerId: string;
  customerName: string;
  queueNumber: number;
  priority: number;
  status: QueueStatus;
  joinTime: Date;
  calledTime?: Date;
  seatedTime?: Date;
  peopleCount: number;
  roomTypePreference: RoomType;
  isVip: boolean;
  vipLevel?: MemberLevel;
  calledCount: number;
  estimatedWaitTime?: number;
  phone?: string;
}

export interface PriorityConfig {
  level: MemberLevel;
  weight: number;
  queuePriority: number;
  canSkipQueue: boolean;
  skipLimitPerDay: number;
  benefits: string[];
}

export type ViewMode = 'day' | 'week' | 'month';
