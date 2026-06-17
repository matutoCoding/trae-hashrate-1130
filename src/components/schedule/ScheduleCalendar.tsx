import { useMemo } from 'react';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../common/Button';
import {
  startOfDay,
  addDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  setHours,
  setMinutes,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Booking } from '@/types';

interface ScheduleCalendarProps {
  onAddBooking?: (roomId?: string, time?: Date) => void;
  onEditBooking?: (bookingId: string) => void;
}

const HOUR_START = 10;
const HOUR_END = 27;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
  const h = (HOUR_START + i) % 24;
  return h;
});
const HOUR_LABELS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
  const h = (HOUR_START + i) % 24;
  return `${h}:00`;
});

function isOvernightBooking(b: Booking): boolean {
  const s = new Date(b.startTime);
  const e = new Date(b.endTime);
  return !isSameDay(s, e);
}

function bookingOverlapsDay(b: Booking, day: Date): boolean {
  const s = new Date(b.startTime);
  const e = new Date(b.endTime);
  const dayStart = startOfDay(day);
  const dayEnd = startOfDay(addDays(day, 1));
  return s < dayEnd && e > dayStart;
}

function getBookingSegmentForDay(b: Booking, day: Date): { start: Date; end: Date } | null {
  if (!bookingOverlapsDay(b, day)) return null;
  const s = new Date(b.startTime);
  const e = new Date(b.endTime);
  const dayStart = startOfDay(day);
  const dayEnd = startOfDay(addDays(day, 1));
  return {
    start: s > dayStart ? s : dayStart,
    end: e < dayEnd ? e : dayEnd,
  };
}

const ROW_HEIGHT = 140;
const HOUR_WIDTH = 60;

export function ScheduleCalendar({ onAddBooking, onEditBooking }: ScheduleCalendarProps) {
  const { rooms, selectedDate, viewMode, setSelectedDate, setIsBookingModalOpen, setSelectedBooking, bookings } = useBookingStore();

  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [selectedDate];
    }
    return eachDayOfInterval({
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    });
  }, [selectedDate, viewMode]);

  const activeRooms = rooms.filter((r) => r.status === 'active');

  const getBookingsForRoomAndDay = (roomId: string, day: Date): Booking[] => {
    return bookings.filter((b) => {
      if (b.roomId !== roomId) return false;
      if (b.status === 'cancelled') return false;
      return bookingOverlapsDay(b, day);
    });
  };

  const navigatePrev = () => {
    setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : -7));
  };

  const navigateNext = () => {
    setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7));
  };

  const getTimePosStyle = (segmentStart: Date, segmentEnd: Date, day: Date) => {
    const dayStart = setMinutes(setHours(startOfDay(day), HOUR_START), 0);
    const dayEnd = setMinutes(setHours(startOfDay(addDays(day, 1)), HOUR_START % 24), 0);

    const effStart = segmentStart > dayStart ? segmentStart : dayStart;
    const effEnd = segmentEnd < dayEnd ? segmentEnd : dayEnd;

    const totalMinutes = (HOUR_END - HOUR_START) * 60;
    const startOffset = differenceInMinutes(effStart, dayStart);
    const duration = differenceInMinutes(effEnd, effStart);

    const left = (startOffset / totalMinutes) * 100;
    const width = (duration / totalMinutes) * 100;

    return {
      left: `${Math.max(left, 0)}%`,
      width: `${Math.max(width, 2)}%`,
    };
  };

  const handleSlotClick = (roomId: string, day: Date, hour: number) => {
    const realHour = hour >= 24 ? hour - 24 : hour;
    const targetDay = hour >= 24 ? addDays(day, -1) : day;
    const time = setMinutes(setHours(targetDay, realHour), 0);
    if (onAddBooking) {
      onAddBooking(roomId, time);
    } else {
      setSelectedBooking(null);
      setIsBookingModalOpen(true, time);
    }
  };

  const handleAddBooking = () => {
    setSelectedBooking(null);
    setIsBookingModalOpen(true, selectedDate);
  };

  const displayDay = days[0];

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
          {(['day', 'week'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => useBookingStore.getState().setViewMode(mode)}
            >
              {mode === 'day' ? '日' : '周'}
            </Button>
          ))}
          <Button onClick={handleAddBooking}>
            <Plus className="w-4 h-4" />
            新增预订
          </Button>
        </div>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-280px)]">
        <div style={{ minWidth: `${(HOUR_END - HOUR_START) * HOUR_WIDTH + 128}px` }}>
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
            <div className="flex">
              <div className="w-32 flex-shrink-0 p-3 border-r border-gray-800">
                <span className="text-xs text-gray-500">包厢 / 时间</span>
              </div>
              <div className="flex-1 flex">
                {HOUR_LABELS.map((label, i) => {
                  const hour = HOURS[i];
                  const isMidnight = hour >= 0 && hour < 6;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 p-2 text-center border-r border-gray-800 last:border-r-0',
                        isMidnight && 'bg-indigo-950/30'
                      )}
                    >
                      <span className={cn(
                        'text-xs',
                        isMidnight ? 'text-indigo-400' : 'text-gray-500'
                      )}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-800">
            {activeRooms.map((room) => (
              <div key={room.id} className="flex">
                <div className="w-32 flex-shrink-0 p-3 border-r border-gray-800 bg-gray-900/50">
                  <div className="text-sm font-medium text-white">{room.name}</div>
                  <div className="text-xs text-gray-500">{room.capacity}人</div>
                </div>

                <div className="flex-1 relative" style={{ height: `${ROW_HEIGHT}px` }}>
                  <div className="absolute inset-0 flex">
                    {HOURS.map((hour, i) => {
                      const isMidnight = hour >= 0 && hour < 6;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 border-r border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors',
                            isMidnight && 'bg-indigo-950/20'
                          )}
                          onClick={() => handleSlotClick(room.id, displayDay, HOUR_START + i)}
                        />
                      );
                    })}
                  </div>

                  <div className="absolute inset-0" style={{ padding: '4px 0' }}>
                    {getBookingsForRoomAndDay(room.id, displayDay).map((booking) => {
                      const segment = getBookingSegmentForDay(booking, displayDay);
                      if (!segment) return null;

                      const style = getTimePosStyle(segment.start, segment.end, displayDay);
                      const overnight = isOvernightBooking(booking);
                      const continuesFromPrev = isBefore(new Date(booking.startTime), startOfDay(displayDay));
                      const continuesToNext = isAfter(new Date(booking.endTime), startOfDay(addDays(displayDay, 1)));

                      return (
                        <div
                          key={`${booking.id}-${formatDate(displayDay)}`}
                          className="absolute top-1 bottom-1 cursor-pointer group"
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditBooking) {
                              onEditBooking(booking.id);
                            } else {
                              setSelectedBooking(booking);
                              setIsBookingModalOpen(true, new Date(booking.startTime));
                            }
                          }}
                        >
                          <div className={cn(
                            'h-full rounded-md px-2 py-1 overflow-hidden text-xs border-l-[3px] transition-all',
                            'hover:shadow-lg hover:brightness-110',
                            booking.status === 'in_use' ? 'bg-green-900/60 border-green-400' :
                            booking.status === 'confirmed' ? 'bg-blue-900/60 border-blue-400' :
                            booking.status === 'pending' ? 'bg-amber-900/60 border-amber-400' :
                            booking.status === 'extended' ? 'bg-purple-900/60 border-purple-400' :
                            'bg-gray-700/60 border-gray-400'
                          )}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium text-white truncate">
                                {booking.customerId && useCustomerStore.getState().getCustomerById(booking.customerId)?.name}
                              </span>
                              {overnight && (
                                <span className="text-[10px] px-1 rounded bg-amber-600/40 text-amber-300 flex-shrink-0">
                                  跨夜
                                </span>
                              )}
                            </div>
                            <div className="text-gray-300 truncate">
                              {formatTime(segment.start)}-{formatTime(segment.end)}
                            </div>
                            {continuesFromPrev && (
                              <div className="text-indigo-300 text-[10px]">← 接前日</div>
                            )}
                            {continuesToNext && (
                              <div className="text-indigo-300 text-[10px]">续次日 →</div>
                            )}
                          </div>
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
