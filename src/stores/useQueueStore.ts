import { create } from 'zustand';
import { QueueItem, MemberLevel, RoomType } from '../types';
import { mockQueue } from '../data/queue';
import { generateId } from '../utils/dateUtils';
import {
  sortQueueByPriority,
  getPriorityByLevel,
  getVipInsertPosition,
  estimateWaitTime,
} from '../utils/queueUtils';

const STORAGE_KEY = 'ktv-queue-store';

interface QueueState {
  queue: QueueItem[];
  currentCallNumber: number;
  queueCounter: number;
  history: QueueItem[];
  
  getWaitingQueue: () => QueueItem[];
  getCalledQueue: () => QueueItem[];
  getQueueItemById: (id: string) => QueueItem | undefined;
  
  addToQueue: (params: {
    customerId: string;
    customerName: string;
    peopleCount: number;
    roomTypePreference: RoomType;
    isVip: boolean;
    vipLevel?: MemberLevel;
    phone?: string;
  }) => void;
  
  callNext: () => QueueItem | null;
  callNumber: (id: string) => void;
  
  seatCustomer: (id: string) => void;
  cancelQueueItem: (id: string) => void;
  noShow: (id: string) => void;
  
  vipCutInLine: (params: {
    customerId: string;
    customerName: string;
    peopleCount: number;
    roomTypePreference: RoomType;
    vipLevel: MemberLevel;
    phone?: string;
  }) => number;
  
  moveToBack: (id: string) => void;
  recalculateEstimatedWait: () => void;
  
  clearCompleted: () => void;
  resetQueue: () => void;
  
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        queue: data.queue?.map((q: any) => ({
          ...q,
          joinTime: new Date(q.joinTime),
          calledTime: q.calledTime ? new Date(q.calledTime) : undefined,
          seatedTime: q.seatedTime ? new Date(q.seatedTime) : undefined,
        })) || mockQueue,
        currentCallNumber: data.currentCallNumber ?? 100,
        queueCounter: data.queueCounter ?? 108,
        history: data.history?.map((h: any) => ({
          ...h,
          joinTime: new Date(h.joinTime),
          calledTime: h.calledTime ? new Date(h.calledTime) : undefined,
          seatedTime: h.seatedTime ? new Date(h.seatedTime) : undefined,
        })) || [],
      };
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return null;
};

const initialState = loadInitialState() || {
  queue: sortQueueByPriority(mockQueue),
  currentCallNumber: 100,
  queueCounter: 108,
  history: [],
};

export const useQueueStore = create<QueueState>((set, get) => ({
  ...initialState,
  
  saveToStorage: () => {
    try {
      const state = get();
      const dataToSave = {
        queue: state.queue.map((q) => ({
          ...q,
          joinTime: q.joinTime.toISOString(),
          calledTime: q.calledTime?.toISOString(),
          seatedTime: q.seatedTime?.toISOString(),
        })),
        currentCallNumber: state.currentCallNumber,
        queueCounter: state.queueCounter,
        history: state.history.map((h) => ({
          ...h,
          joinTime: h.joinTime.toISOString(),
          calledTime: h.calledTime?.toISOString(),
          seatedTime: h.seatedTime?.toISOString(),
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },
  
  loadFromStorage: () => {
    const state = loadInitialState();
    if (state) {
      set(state);
    }
  },
  
  getWaitingQueue: () => {
    return sortQueueByPriority(get().queue.filter((q) => q.status === 'waiting'));
  },
  
  getCalledQueue: () => {
    return get().queue.filter((q) => q.status === 'called');
  },
  
  getQueueItemById: (id) => {
    return get().queue.find((q) => q.id === id);
  },
  
  addToQueue: (params) => {
    const priority = params.isVip && params.vipLevel
      ? getPriorityByLevel(params.vipLevel)
      : 1;
    
    const newItem: QueueItem = {
      id: generateId(),
      customerId: params.customerId,
      customerName: params.customerName,
      queueNumber: get().queueCounter + 1,
      priority,
      status: 'waiting',
      joinTime: new Date(),
      peopleCount: params.peopleCount,
      roomTypePreference: params.roomTypePreference,
      isVip: params.isVip,
      vipLevel: params.vipLevel,
      calledCount: 0,
      phone: params.phone,
    };
    
    set((state) => {
      const newQueue = sortQueueByPriority([...state.queue, newItem]);
      const waitingItems = newQueue.filter((q) => q.status === 'waiting');
      
      const updatedQueue = newQueue.map((item) => {
        if (item.status === 'waiting') {
          const index = waitingItems.findIndex((w) => w.id === item.id);
          return {
            ...item,
            estimatedWaitTime: estimateWaitTime(index),
          };
        }
        return item;
      });
      
      return {
        queue: updatedQueue,
        queueCounter: state.queueCounter + 1,
      };
    });
    
    get().saveToStorage();
  },
  
  callNext: () => {
    const waitingQueue = get().getWaitingQueue();
    if (waitingQueue.length === 0) return null;
    
    const nextItem = waitingQueue[0];
    get().callNumber(nextItem.id);
    
    return nextItem;
  },
  
  callNumber: (id) => {
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'called' as const,
              calledTime: new Date(),
              calledCount: q.calledCount + 1,
            }
          : q
      ),
      currentCallNumber: state.queue.find((q) => q.id === id)?.queueNumber || state.currentCallNumber,
    }));
    
    get().recalculateEstimatedWait();
    get().saveToStorage();
  },
  
  seatCustomer: (id) => {
    const item = get().getQueueItemById(id);
    
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'seated' as const,
              seatedTime: new Date(),
            }
          : q
      ),
    }));
    
    if (item) {
      set((state) => ({
        history: [...state.history, item],
      }));
    }
    
    get().saveToStorage();
  },
  
  cancelQueueItem: (id) => {
    const item = get().getQueueItemById(id);
    
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id ? { ...q, status: 'cancelled' as const } : q
      ),
    }));
    
    if (item) {
      set((state) => ({
        history: [...state.history, { ...item, status: 'cancelled' as const }],
      }));
    }
    
    get().recalculateEstimatedWait();
    get().saveToStorage();
  },
  
  noShow: (id) => {
    const item = get().getQueueItemById(id);
    
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id ? { ...q, status: 'no_show' as const } : q
      ),
    }));
    
    if (item) {
      set((state) => ({
        history: [...state.history, { ...item, status: 'no_show' as const }],
      }));
    }
    
    get().recalculateEstimatedWait();
    get().saveToStorage();
  },
  
  vipCutInLine: (params) => {
    const priority = getPriorityByLevel(params.vipLevel);
    
    const newItem: QueueItem = {
      id: generateId(),
      customerId: params.customerId,
      customerName: params.customerName,
      queueNumber: get().queueCounter + 1,
      priority,
      status: 'waiting',
      joinTime: new Date(),
      peopleCount: params.peopleCount,
      roomTypePreference: params.roomTypePreference,
      isVip: true,
      vipLevel: params.vipLevel,
      calledCount: 0,
      phone: params.phone,
    };
    
    set((state) => {
      const waitingQueue = state.queue.filter((q) => q.status === 'waiting');
      const insertPosition = getVipInsertPosition(waitingQueue, params.vipLevel);
      
      const newWaitingQueue = [
        ...waitingQueue.slice(0, insertPosition),
        newItem,
        ...waitingQueue.slice(insertPosition),
      ];
      
      const otherQueue = state.queue.filter((q) => q.status !== 'waiting');
      
      const updatedWaiting = newWaitingQueue.map((item, index) => ({
        ...item,
        estimatedWaitTime: estimateWaitTime(index),
      }));
      
      return {
        queue: [...otherQueue, ...updatedWaiting],
        queueCounter: state.queueCounter + 1,
      };
    });
    
    get().saveToStorage();
    
    const queue = get().queue.filter((q) => q.status === 'waiting');
    return queue.findIndex((q) => q.id === newItem.id);
  },
  
  moveToBack: (id) => {
    set((state) => {
      const item = state.queue.find((q) => q.id === id);
      if (!item) return state;
      
      const waitingQueue = state.queue.filter((q) => q.status === 'waiting' && q.id !== id);
      const otherQueue = state.queue.filter((q) => q.id === id || q.status !== 'waiting');
      
      const movedItem = { ...item, status: 'waiting' as const, calledTime: undefined };
      const newWaitingQueue = [...waitingQueue, movedItem];
      
      const updatedWaiting = newWaitingQueue.map((itm, index) => ({
        ...itm,
        estimatedWaitTime: estimateWaitTime(index),
      }));
      
      return {
        queue: [...otherQueue.filter((q) => q.id !== id), ...updatedWaiting],
      };
    });
    
    get().saveToStorage();
  },
  
  recalculateEstimatedWait: () => {
    set((state) => {
      const waitingQueue = state.queue
        .filter((q) => q.status === 'waiting')
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime();
        });
      
      const updatedWaiting = waitingQueue.map((item, index) => ({
        ...item,
        estimatedWaitTime: estimateWaitTime(index),
      }));
      
      const otherQueue = state.queue.filter((q) => q.status !== 'waiting');
      
      return {
        queue: [...otherQueue, ...updatedWaiting],
      };
    });
  },
  
  clearCompleted: () => {
    set((state) => ({
      queue: state.queue.filter((q) => q.status === 'waiting' || q.status === 'called'),
    }));
    get().saveToStorage();
  },
  
  resetQueue: () => {
    set({
      queue: [],
      currentCallNumber: 0,
      queueCounter: 0,
      history: [],
    });
    get().saveToStorage();
  },
}));
