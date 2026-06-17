import { create } from 'zustand';
import { Customer, MemberLevel, RecurringRule, PriorityConfig } from '../types';
import { mockCustomers } from '../data/customers';
import { mockRecurringRules } from '../data/recurringRules';
import { generateId } from '../utils/dateUtils';

interface CustomerState {
  customers: Customer[];
  recurringRules: RecurringRule[];
  
  priorityConfigs: PriorityConfig[];
  
  getCustomerById: (id: string) => Customer | undefined;
  getVipCustomers: () => Customer[];
  searchCustomers: (keyword: string) => Customer[];
  
  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'totalSpent' | 'visitCount'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  upgradeMemberLevel: (id: string, newLevel: MemberLevel) => void;
  addPoints: (id: string, points: number) => void;
  
  getRecurringRules: () => RecurringRule[];
  getRecurringRuleById: (id: string) => RecurringRule | undefined;
  getRecurringRulesByCustomer: (customerId: string) => RecurringRule[];
  
  addRecurringRule: (rule: Omit<RecurringRule, 'id'>) => void;
  updateRecurringRule: (id: string, updates: Partial<RecurringRule>) => void;
  deleteRecurringRule: (id: string) => void;
  toggleRecurringRule: (id: string) => void;
  
  getPriorityConfig: (level: MemberLevel) => PriorityConfig | undefined;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: mockCustomers,
  recurringRules: mockRecurringRules,
  
  priorityConfigs: [
    {
      level: 'normal',
      weight: 1,
      queuePriority: 1,
      canSkipQueue: false,
      skipLimitPerDay: 0,
      benefits: ['基础服务', '积分累计'],
    },
    {
      level: 'silver',
      weight: 2,
      queuePriority: 2,
      canSkipQueue: false,
      skipLimitPerDay: 0,
      benefits: ['生日优惠', '积分1.5倍', '专属客服'],
    },
    {
      level: 'gold',
      weight: 3,
      queuePriority: 3,
      canSkipQueue: true,
      skipLimitPerDay: 1,
      benefits: ['优先排队', '积分2倍', '免费小吃', '生日礼包'],
    },
    {
      level: 'platinum',
      weight: 4,
      queuePriority: 4,
      canSkipQueue: true,
      skipLimitPerDay: 2,
      benefits: ['VIP插队', '积分2.5倍', '免费酒水套餐', '专属包厢预留', '管家服务'],
    },
    {
      level: 'diamond',
      weight: 5,
      queuePriority: 5,
      canSkipQueue: true,
      skipLimitPerDay: 5,
      benefits: ['钻石专属通道', '积分3倍', '顶级酒水套餐', 'VIP包厢优先', '私人管家', '专属派对定制'],
    },
  ],
  
  getCustomerById: (id) => get().customers.find((c) => c.id === id),
  
  getVipCustomers: () => get().customers.filter((c) => c.isVip),
  
  searchCustomers: (keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return get().customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerKeyword) ||
        c.phone.includes(keyword)
    );
  },
  
  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateId(),
      points: 0,
      totalSpent: 0,
      visitCount: 0,
    };
    
    set((state) => ({
      customers: [...state.customers, newCustomer],
    }));
  },
  
  updateCustomer: (id, updates) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },
  
  deleteCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },
  
  upgradeMemberLevel: (id, newLevel) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id
          ? { ...c, memberLevel: newLevel, isVip: ['gold', 'platinum', 'diamond'].includes(newLevel) }
          : c
      ),
    }));
  },
  
  addPoints: (id, points) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, points: c.points + points } : c
      ),
    }));
  },
  
  getRecurringRules: () => get().recurringRules,
  
  getRecurringRuleById: (id) => get().recurringRules.find((r) => r.id === id),
  
  getRecurringRulesByCustomer: (customerId) =>
    get().recurringRules.filter((r) => r.customerId === customerId),
  
  addRecurringRule: (ruleData) => {
    const newRule: RecurringRule = {
      ...ruleData,
      id: generateId(),
    };
    
    set((state) => ({
      recurringRules: [...state.recurringRules, newRule],
    }));
  },
  
  updateRecurringRule: (id, updates) => {
    set((state) => ({
      recurringRules: state.recurringRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  },
  
  deleteRecurringRule: (id) => {
    set((state) => ({
      recurringRules: state.recurringRules.filter((r) => r.id !== id),
    }));
  },
  
  toggleRecurringRule: (id) => {
    set((state) => ({
      recurringRules: state.recurringRules.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      ),
    }));
  },
  
  getPriorityConfig: (level) =>
    get().priorityConfigs.find((c) => c.level === level),
}));
