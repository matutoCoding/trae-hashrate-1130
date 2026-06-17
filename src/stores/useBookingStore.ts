import { create } from 'zustand';
import { Room, Booking, Package, ViewMode, PaymentMethod, SettlementRecord } from '../types';
import { mockRooms } from '../data/rooms';
import { mockBookings } from '../data/bookings';
import { mockPackages } from '../data/packages';
import { generateId } from '../utils/dateUtils';
import { calculateBookingPrice, calculateExtraPrice } from '../utils/priceUtils';
import { useCustomerStore } from './useCustomerStore';

const STORAGE_KEY = 'ktv-booking-store';

interface BookingState {
  rooms: Room[];
  bookings: Booking[];
  packages: Package[];
  selectedDate: Date;
  viewMode: ViewMode;
  selectedBooking: Booking | null;
  isBookingModalOpen: boolean;
  isExtendModalOpen: boolean;
  modalBaseDate: Date;
  
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsBookingModalOpen: (open: boolean, baseDate?: Date) => void;
  setIsExtendModalOpen: (open: boolean) => void;
  
  getRoomById: (id: string) => Room | undefined;
  getPackageById: (id: string) => Package | undefined;
  getBookingsByRoom: (roomId: string) => Booking[];
  getBookingsByDate: (date: Date) => Booking[];
  getBookingsByRoomAndDate: (roomId: string, date: Date) => Booking[];
  hasBookingsForRoom: (roomId: string) => boolean;
  checkConflict: (roomId: string, startTime: Date, endTime: Date, excludeId?: string) => Booking | null;
  
  addBooking: (booking: Omit<Booking, 'id' | 'totalPrice' | 'extraHours' | 'extraPrice'> & { packageId?: string }) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  cancelBooking: (id: string, reason?: string) => void;
  
  extendBooking: (id: string, hours: number) => void;
  addBookings: (bookings: Booking[]) => void;
  
  confirmArrival: (id: string) => void;
  checkIn: (id: string) => void;
  completeBooking: (id: string, params: {
    paymentMethod: PaymentMethod;
    discount: number;
    rounding: number;
    pointsUsed?: number;
    notes?: string;
  }) => void;
  
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => boolean;
  
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        rooms: data.rooms?.map((r: any) => ({ ...r })) || mockRooms,
        bookings: data.bookings?.map((b: any) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
          cancelTime: b.cancelTime ? new Date(b.cancelTime) : undefined,
          settlement: b.settlement ? {
            ...b.settlement,
            settledAt: new Date(b.settlement.settledAt),
          } : undefined,
        })) || mockBookings,
        packages: data.packages?.map((p: any) => ({ ...p })) || mockPackages,
        selectedDate: data.selectedDate ? new Date(data.selectedDate) : new Date(),
        viewMode: data.viewMode || 'day' as ViewMode,
      };
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return null;
};

const initialState = loadInitialState() || {
  rooms: mockRooms,
  bookings: mockBookings,
  packages: mockPackages,
  selectedDate: new Date(),
  viewMode: 'day' as ViewMode,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,
  selectedBooking: null,
  isBookingModalOpen: false,
  isExtendModalOpen: false,
  modalBaseDate: new Date(),
  
  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().saveToStorage();
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
    get().saveToStorage();
  },
  
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  
  setIsBookingModalOpen: (open, baseDate) => {
    set({
      isBookingModalOpen: open,
      modalBaseDate: baseDate || get().selectedDate,
    });
  },
  
  setIsExtendModalOpen: (open) => set({ isExtendModalOpen: open }),
  
  getRoomById: (id) => get().rooms.find((r) => r.id === id),
  getPackageById: (id) => get().packages.find((p) => p.id === id),
  
  getBookingsByRoom: (roomId) =>
    get().bookings.filter((b) => b.roomId === roomId),
  
  getBookingsByDate: (date) =>
    get().bookings.filter((b) => {
      const bookingDate = new Date(b.startTime);
      return (
        bookingDate.getFullYear() === date.getFullYear() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getDate() === date.getDate()
      );
    }),
  
  getBookingsByRoomAndDate: (roomId, date) =>
    get().bookings.filter((b) => {
      const startDate = new Date(b.startTime);
      const endDate = new Date(b.endTime);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return (
        b.roomId === roomId &&
        startDate <= dayEnd &&
        endDate >= dayStart
      );
    }),
  
  hasBookingsForRoom: (roomId) =>
    get().bookings.some((b) => b.roomId === roomId),
  
  checkConflict: (roomId, startTime, endTime, excludeId) => {
    const activeBookings = get().bookings.filter(
      (b) =>
        b.roomId === roomId &&
        b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        (!excludeId || b.id !== excludeId)
    );
    
    for (const b of activeBookings) {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      if (startTime < bEnd && endTime > bStart) {
        return b;
      }
    }
    return null;
  },
  
  addBooking: (bookingData) => {
    const room = get().getRoomById(bookingData.roomId);
    const pkg = bookingData.packageId
      ? get().getPackageById(bookingData.packageId)
      : null;
    
    const totalPrice = room
      ? calculateBookingPrice(
          room,
          new Date(bookingData.startTime),
          new Date(bookingData.endTime),
          pkg?.price || 0
        )
      : 0;
    
    const newBooking: Booking = {
      ...bookingData,
      id: generateId(),
      totalPrice,
      extraHours: 0,
      extraPrice: 0,
      status: bookingData.status || 'confirmed',
    };
    
    set((state) => ({
      bookings: [...state.bookings, newBooking],
    }));
    
    get().saveToStorage();
  },
  
  updateBooking: (id, updates) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
    get().saveToStorage();
  },
  
  cancelBooking: (id, reason) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const, cancelTime: new Date(), cancelReason: reason || '手动取消' } : b
      ),
    }));
    get().saveToStorage();
  },
  
  extendBooking: (id, hours) => {
    const booking = get().bookings.find((b) => b.id === id);
    const room = booking ? get().getRoomById(booking.roomId) : null;
    
    if (!booking || !room) return;
    
    const extraPrice = calculateExtraPrice(room, hours);
    const newEndTime = new Date(booking.endTime);
    newEndTime.setHours(newEndTime.getHours() + hours);
    
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              endTime: newEndTime,
              extraHours: b.extraHours + hours,
              extraPrice: b.extraPrice + extraPrice,
              status: 'extended' as const,
            }
          : b
      ),
    }));
    get().saveToStorage();
  },
  
  addBookings: (newBookings) => {
    set((state) => ({
      bookings: [...state.bookings, ...newBookings],
    }));
    get().saveToStorage();
  },
  
  confirmArrival: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'arrived' as const } : b
      ),
    }));
    get().saveToStorage();
  },
  
  checkIn: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'in_use' as const } : b
      ),
    }));
    get().saveToStorage();
  },
  
  completeBooking: (id, params) => {
    const booking = get().bookings.find((b) => b.id === id);
    if (!booking) return;
    
    const customerId = booking.customerId;
    const roomFee = booking.totalPrice;
    const packageFee = booking.packageId ? (get().getPackageById(booking.packageId)?.price || 0) : 0;
    const extraFee = booking.extraPrice;
    
    const subtotal = roomFee + extraFee;
    const { discount = 0, rounding = 0, pointsUsed = 0 } = params;
    const totalAmount = subtotal - discount - rounding - pointsUsed;
    
    const pointsEarned = Math.floor(Math.max(totalAmount, 0) / 10);
    
    const settlement: SettlementRecord = {
      id: generateId(),
      bookingId: id,
      roomFee,
      packageFee,
      extraFee,
      subtotal,
      discount,
      rounding,
      totalAmount: Math.max(totalAmount, 0),
      paymentMethod: params.paymentMethod,
      pointsEarned,
      pointsUsed,
      settledAt: new Date(),
      notes: params.notes,
    };
    
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'completed' as const, settlement } : b
      ),
    }));
    
    if (customerId) {
      const { updateCustomer, getCustomerById } = useCustomerStore.getState();
      const customer = getCustomerById(customerId);
      if (customer) {
        updateCustomer(customerId, {
          totalSpent: customer.totalSpent + Math.max(totalAmount, 0),
          visitCount: customer.visitCount + 1,
          points: customer.points + pointsEarned - pointsUsed,
        });
      }
    }
    
    get().saveToStorage();
  },
  
  addRoom: (roomData) => {
    const newRoom: Room = {
      ...roomData,
      id: generateId(),
    };
    set((state) => ({
      rooms: [...state.rooms, newRoom],
    }));
    get().saveToStorage();
  },
  
  updateRoom: (id, updates) => {
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    get().saveToStorage();
  },
  
  deleteRoom: (id) => {
    if (get().hasBookingsForRoom(id)) {
      return false;
    }
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
    }));
    get().saveToStorage();
    return true;
  },
  
  addPackage: (pkgData) => {
    const newPkg: Package = {
      ...pkgData,
      id: generateId(),
    };
    set((state) => ({
      packages: [...state.packages, newPkg],
    }));
    get().saveToStorage();
  },
  
  updatePackage: (id, updates) => {
    set((state) => ({
      packages: state.packages.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    get().saveToStorage();
  },
  
  deletePackage: (id) => {
    set((state) => ({
      packages: state.packages.filter((p) => p.id !== id),
    }));
    get().saveToStorage();
  },
  
  loadFromStorage: () => {
    const state = loadInitialState();
    if (state) {
      set(state);
    }
  },
  
  saveToStorage: () => {
    try {
      const state = get();
      const dataToSave = {
        rooms: state.rooms,
        bookings: state.bookings.map((b) => ({
          ...b,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          cancelTime: b.cancelTime?.toISOString(),
          settlement: b.settlement ? {
            ...b.settlement,
            settledAt: b.settlement.settledAt.toISOString(),
          } : undefined,
        })),
        packages: state.packages,
        selectedDate: state.selectedDate.toISOString(),
        viewMode: state.viewMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },
}));
