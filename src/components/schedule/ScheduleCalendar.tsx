import { useMemo } from 'react';
import { useBookingStore } from '@/stores/useBookingStore';
import { BookingCard } from './BookingCard';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../common/Button';
import {
  startOfDay,
  addDays,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  setHours,
  setMinutes,
  differenceInMinutes,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ScheduleCalendarProps {
  onAddBooking?: (roomId?: string, time?: Date) => void;
  onEditBooking?: (bookingId: string) => void;
}

const HOURS_START = 10;
const HOURS_END = 24;
const HOURS = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i);

export function ScheduleCalendar({ onAddBooking, onEditBooking }: ScheduleCalendarProps) {
  const { rooms, bookings, selectedDate, viewMode, setSelectedDate, setIsBookingModalOpen, setSelectedBooking, getBookingsByRoomAndDate } = useBookingStore();
  
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      });
    } else {
      return eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      });
    }
  }, [selectedDate, viewMode]);
  
  const activeRooms = rooms.filter((r) => r.status === 'active');
  
  const getBookingsForRoomAndDay = (roomId: string, day: Date) => {
    return getBookingsByRoomAndDate(roomId, day);
  };
  
  const navigatePrev = () => {
    if (viewMode === 'day') {
      setSelectedDate(addDays(selectedDate, -1));
    } else {
      setSelectedDate(addDays(selectedDate, -7));
    }
  };
  
  const navigateNext = () => {
    if (viewMode === 'day') {
      setSelectedDate(addDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 7));
    }
  };
  
  const getBookingStyle = (startTime: Date, endTime: Date, day: Date) => {
    const dayStart = setMinutes(setHours(startOfDay(day), HOURS_START), 0);
    const dayEnd = setMinutes(setHours(startOfDay(addDays(day, 1)), HOURS_START), 0);
    
    const effectiveStart = startTime > dayStart ? startTime : dayStart;
    const effectiveEnd = endTime < dayEnd ? endTime : dayEnd;
    
    const top = (differenceInMinutes(effectiveStart, dayStart) / 60) * 60;
    const height = (differenceInMinutes(effectiveEnd, effectiveStart) / 60) * 60;
    
    return {
      top: `${Math.max(top, 0)}px`,
      height: `${Math.max(height, 30)}px`,
    };
  };
  
  const handleSlotClick = (roomId: string, day: Date, hour: number) => {
    const time = setMinutes(setHours(day, hour), 0);
    if (onAddBooking) {
      onAddBooking(roomId, time);
    } else {
      setSelectedBooking(null);
      setIsBookingModalOpen(true, day);
    }
  };
  
  const handleAddBooking = () => {
    setSelectedBooking(null);
    setIsBookingModalOpen(true, selectedDate);
  };
  
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <h3 className="text-lg font-semibold text-white">
              {viewMode === 'day'
                ? formatDate(selectedDate, 'yyyy年MM月dd日 EEEE')
                : `${formatDate(days[0], 'MM月dd日')} - ${formatDate(days[days.length - 1], 'MM月dd日')}`}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={navigateNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => useBookingStore.getState().setViewMode(mode)}
            >
              {mode === 'day' ? '日' : mode === 'week' ? '周' : '月'}
            </Button>
          ))}
          <Button onClick={handleAddBooking}>
            <Plus className="w-4 h-4" />
            新增预订
          </Button>
        </div>
      </div>
      
      <div className="overflow-auto max-h-[calc(100vh-280px)]">
        <div className="min-w-[800px]">
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
            <div className="flex">
              <div className="w-32 flex-shrink-0 p-3 border-r border-gray-800">
                <span className="text-xs text-gray-500">包厢 / 时间</span>
              </div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 p-2 text-center border-r border-gray-800 last:border-r-0"
                >
                  <span className="text-xs text-gray-500">{hour}:00</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="divide-y divide-gray-800">
            {activeRooms.map((room) => (
              <div key={room.id} className="flex">
                <div className="w-32 flex-shrink-0 p-3 border-r border-gray-800 bg-gray-900/50">
                  <div className="text-sm font-medium text-white">{room.name}</div>
                  <div className="text-xs text-gray-500">{room.capacity}人</div>
                </div>
                
                <div className="flex-1 relative h-[140px]">
                  <div className="absolute inset-0 flex">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="flex-1 border-r border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                        onClick={() => handleSlotClick(room.id, selectedDate, hour)}
                      />
                    ))}
                  </div>
                  
                  <div className="absolute inset-0 p-1">
                    {getBookingsForRoomAndDay(room.id, selectedDate).map((booking) => {
                      const style = getBookingStyle(
                        new Date(booking.startTime),
                        new Date(booking.endTime),
                        selectedDate
                      );
                      return (
                        <div
                          key={booking.id}
                          className="absolute left-1 right-1"
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                            setIsBookingModalOpen(true, new Date(booking.startTime));
                          }}
                        >
                          <BookingCard bookingId={booking.id} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
