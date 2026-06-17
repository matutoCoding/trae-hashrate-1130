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
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: sortQueueByPriority(mockQueue),
  currentCallNumber: 100,
  queueCounter: 108,
  history: [],
  
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
  },
  
  seatCustomer: (id) => {
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
    
    const item = get().getQueueItemById(id);
    if (item) {
      set((state) => ({
        history: [...state.history, item],
      }));
    }
  },
  
  cancelQueueItem: (id) => {
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id ? { ...q, status: 'cancelled' as const } : q
      ),
    }));
    
    const item = get().getQueueItemById(id);
    if (item) {
      set((state) => ({
        history: [...state.history, { ...item, status: 'cancelled' as const }],
      }));
    }
    
    get().recalculateEstimatedWait();
  },
  
  noShow: (id) => {
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id ? { ...q, status: 'no_show' as const } : q
      ),
    }));
    
    const item = get().getQueueItemById(id);
    if (item) {
      set((state) => ({
        history: [...state.history, { ...item, status: 'no_show' as const }],
      }));
    }
    
    get().recalculateEstimatedWait();
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
  },
  
  resetQueue: () => {
    set({
      queue: [],
      currentCallNumber: 0,
      queueCounter: 0,
      history: [],
    });
  },
}));
