import { create } from 'zustand';
import { Room, Booking, Package, ViewMode } from '../types';
import { mockRooms } from '../data/rooms';
import { mockBookings } from '../data/bookings';
import { mockPackages } from '../data/packages';
import { generateId } from '../utils/dateUtils';
import { calculateBookingPrice, calculateExtraPrice } from '../utils/priceUtils';

interface BookingState {
  rooms: Room[];
  bookings: Booking[];
  packages: Package[];
  selectedDate: Date;
  viewMode: ViewMode;
  selectedBooking: Booking | null;
  isBookingModalOpen: boolean;
  isExtendModalOpen: boolean;
  
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsBookingModalOpen: (open: boolean) => void;
  setIsExtendModalOpen: (open: boolean) => void;
  
  getRoomById: (id: string) => Room | undefined;
  getPackageById: (id: string) => Package | undefined;
  getBookingsByRoom: (roomId: string) => Booking[];
  getBookingsByDate: (date: Date) => Booking[];
  
  addBooking: (booking: Omit<Booking, 'id' | 'totalPrice' | 'extraHours' | 'extraPrice'> & { packageId?: string }) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  
  extendBooking: (id: string, hours: number) => void;
  addBookings: (bookings: Booking[]) => void;
  
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  rooms: mockRooms,
  bookings: mockBookings,
  packages: mockPackages,
  selectedDate: new Date(),
  viewMode: 'day',
  selectedBooking: null,
  isBookingModalOpen: false,
  isExtendModalOpen: false,
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setIsBookingModalOpen: (open) => set({ isBookingModalOpen: open }),
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
  },
  
  updateBooking: (id, updates) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  },
  
  cancelBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const } : b
      ),
    }));
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
  },
  
  addBookings: (newBookings) => {
    set((state) => ({
      bookings: [...state.bookings, ...newBookings],
    }));
  },
  
  addRoom: (roomData) => {
    const newRoom: Room = {
      ...roomData,
      id: generateId(),
    };
    set((state) => ({
      rooms: [...state.rooms, newRoom],
    }));
  },
  
  updateRoom: (id, updates) => {
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  },
  
  deleteRoom: (id) => {
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
    }));
  },
  
  addPackage: (pkgData) => {
    const newPkg: Package = {
      ...pkgData,
      id: generateId(),
    };
    set((state) => ({
      packages: [...state.packages, newPkg],
    }));
  },
  
  updatePackage: (id, updates) => {
    set((state) => ({
      packages: state.packages.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  
  deletePackage: (id) => {
    set((state) => ({
      packages: state.packages.filter((p) => p.id !== id),
    }));
  },
}));
