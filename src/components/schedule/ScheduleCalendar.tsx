import { useMemo, useState } from 'react';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatDate, formatTime } from '@/utils/dateUtils';
import {
  getDisplayHours,
  getDisplayHourLabels,
  getBusinessDayStart,
  getBusinessDayEnd,
  getBookingSegmentForBusinessDay,
  getTimePositionPercent,
  getDateTimeForAbsoluteHour,
  getWeekBusinessDays,
  isMidnightHour,
  navigateBusinessDay,
} from '@/utils/businessHours';
import { ChevronLeft, ChevronRight, Plus, Filter, X } from 'lucide-react';
import { Button } from '../common/Button';
import { startOfDay, isBefore, isAfter, isSameDay, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Booking, RoomType, BookingStatus, MemberLevel } from '@/types';
import {
  getRoomTypeLabel,
  getBookingStatusLabel,
  getMemberLevelLabel,
  getBookingStatusColor,
} from '@/utils/priceUtils';

interface ScheduleFilter {
  roomType?: RoomType | 'all';
  bookingStatus?: BookingStatus | 'all';
  memberLevel?: MemberLevel | 'all';
  showCancelled?: boolean;
}

interface ScheduleCalendarProps {
  onAddBooking?: (roomId?: string, time?: Date) => void;
  onEditBooking?: (bookingId: string) => void;
}

const ROW_HEIGHT = 140;
const HOUR_WIDTH = 60;

function isOvernightBooking(b: Booking): boolean {
  const s = new Date(b.startTime);
  const e = new Date(b.endTime);
  return !isSameDay(s, e);
}

function bookingOverlapsBusinessDay(b: Booking, businessDay: Date): boolean {
  const s = new Date(b.startTime);
  const e = new Date(b.endTime);
  const dayStart = getBusinessDayStart(businessDay);
  const dayEnd = getBusinessDayEnd(businessDay);
  return s < dayEnd && e > dayStart;
}

export function ScheduleCalendar({ onAddBooking, onEditBooking }: ScheduleCalendarProps) {
  const { rooms, selectedDate, viewMode, setSelectedDate, setViewMode, setIsBookingModalOpen, setSelectedBooking, bookings } = useBookingStore();
  const { customers } = useCustomerStore();

  const [filter, setFilter] = useState<ScheduleFilter>({
    roomType: 'all',
    bookingStatus: 'all',
    memberLevel: 'all',
    showCancelled: false,
  });
  const [showFilterBar, setShowFilterBar] = useState(true);

  const businessDay = useMemo(() => startOfDay(selectedDate), [selectedDate]);

  const HOURS = getDisplayHours();
  const HOUR_LABELS = getDisplayHourLabels();
  const TOTAL_HOURS = HOURS.length;

  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [businessDay];
    }
    return getWeekBusinessDays(selectedDate);
  }, [selectedDate, viewMode, businessDay]);

  const filteredRooms = useMemo(() => {
    let list = rooms.filter((r) => r.status === 'active');
    if (filter.roomType && filter.roomType !== 'all') {
      list = list.filter((r) => r.type === filter.roomType);
    }
    return list;
  }, [rooms, filter.roomType]);

  const getBookingsForRoomAndDay = (roomId: string, day: Date): Booking[] => {
    return bookings.filter((b) => {
      if (b.roomId !== roomId) return false;
      if (!filter.showCancelled && b.status === 'cancelled') return false;
      if (!bookingOverlapsBusinessDay(b, day)) return false;
      if (filter.bookingStatus && filter.bookingStatus !== 'all') {
        if (b.status !== filter.bookingStatus) return false;
      }
      if (filter.memberLevel && filter.memberLevel !== 'all') {
        const c = customers.find((c) => c.id === b.customerId);
        if (!c || c.memberLevel !== filter.memberLevel) return false;
      }
      return true;
    });
  };

  const navigatePrev = () => {
    const next = navigateBusinessDay(businessDay, -1, viewMode === 'month' ? 'day' : viewMode);
    setSelectedDate(next);
  };

  const navigateNext = () => {
    const next = navigateBusinessDay(businessDay, 1, viewMode === 'month' ? 'day' : viewMode);
    setSelectedDate(next);
  };

  const handleSlotClick = (roomId: string, day: Date, absoluteHour: number) => {
    const time = getDateTimeForAbsoluteHour(day, absoluteHour);
    if (onAddBooking) {
      onAddBooking(roomId, time);
    } else {
      setSelectedBooking(null);
      setIsBookingModalOpen(true, time);
    }
  };

  const handleAddBooking = () => {
    setSelectedBooking(null);
    const baseDate = selectedDate;
    if (filteredRooms.length === 1) {
      setIsBookingModalOpen(true, baseDate);
    } else {
      setIsBookingModalOpen(true, baseDate);
    }
  };

  const resetFilter = () => {
    setFilter({ roomType: 'all', bookingStatus: 'all', memberLevel: 'all', showCancelled: false });
  };

  const hasActiveFilter = filter.roomType !== 'all' || filter.bookingStatus !== 'all' || filter.memberLevel !== 'all' || filter.showCancelled;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex flex-col border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
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
              <p className="text-[10px] text-gray-500 -mt-1">
                营业日 10:00 - 次日03:00
              </p>
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
                onClick={() => setViewMode(mode)}
              >
                {mode === 'day' ? '日' : '周'}
              </Button>
            ))}
            <Button
              variant={hasActiveFilter ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowFilterBar(!showFilterBar)}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilter && (
                <span className="text-[10px] bg-red-500 rounded-full w-4 h-4 flex items-center justify-center -ml-1 -mt-1">!</span>
              )}
            </Button>
            <Button onClick={handleAddBooking}>
              <Plus className="w-4 h-4" />
              新增预订
              {filteredRooms.length === 1 && (
                <span className="ml-1 text-xs opacity-70">
                  ({filteredRooms[0].name})
                </span>
              )}
            </Button>
          </div>
        </div>

        {showFilterBar && (
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-t border-gray-800">
            <span className="text-xs text-gray-400 flex-shrink-0">筛选：</span>
            <select
              value={filter.roomType}
              onChange={(e) => setFilter({ ...filter, roomType: e.target.value as any })}
              className="h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">全部包厢类型</option>
              {(['small', 'medium', 'large', 'vip', 'party'] as RoomType[]).map((t) => (
                <option key={t} value={t}>{getRoomTypeLabel(t)}</option>
              ))}
            </select>

            <select
              value={filter.bookingStatus}
              onChange={(e) => setFilter({ ...filter, bookingStatus: e.target.value as any })}
              className="h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">全部预订状态</option>
              {(['pending', 'confirmed', 'arrived', 'in_use', 'extended', 'completed'] as BookingStatus[]).map((s) => (
                <option key={s} value={s}>{getBookingStatusLabel(s)}</option>
              ))}
            </select>

            <select
              value={filter.memberLevel}
              onChange={(e) => setFilter({ ...filter, memberLevel: e.target.value as any })}
              className="h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">全部会员等级</option>
              {(['normal', 'silver', 'gold', 'platinum', 'diamond'] as MemberLevel[]).map((l) => (
                <option key={l} value={l}>{getMemberLevelLabel(l)}</option>
              ))}
            </select>

            <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.showCancelled}
                onChange={(e) => setFilter({ ...filter, showCancelled: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
              />
              显示已取消
            </label>

            {hasActiveFilter && (
              <Button size="sm" variant="ghost" onClick={resetFilter}>
                <X className="w-3 h-3" />
                清除
              </Button>
            )}

            <span className="text-xs text-gray-500 ml-auto">
              显示 {filteredRooms.length} 间包厢
            </span>
          </div>
        )}
      </div>

      <div className="overflow-auto max-h-[calc(100vh-340px)]">
        <div style={{ minWidth: `${TOTAL_HOURS * HOUR_WIDTH + 128}px` }}>
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
            <div className="flex">
              <div className="w-32 flex-shrink-0 p-3 border-r border-gray-800">
                <span className="text-xs text-gray-500">包厢 / 时间</span>
              </div>
              <div className="flex-1 flex">
                {HOUR_LABELS.map((label, i) => {
                  const hour = HOURS[i];
                  const midnight = isMidnightHour(hour);
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 p-2 text-center border-r border-gray-800 last:border-r-0',
                        midnight && 'bg-indigo-950/30'
                      )}
                    >
                      <span className={cn(
                        'text-xs',
                        midnight ? 'text-indigo-400' : 'text-gray-500'
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
            {filteredRooms.map((room) => (
              <div key={room.id} className="flex">
                <div className="w-32 flex-shrink-0 p-3 border-r border-gray-800 bg-gray-900/50">
                  <div className="text-sm font-medium text-white">{room.name}</div>
                  <div className="text-xs text-gray-500">{room.capacity}人 · {getRoomTypeLabel(room.type)}</div>
                </div>

                {days.map((displayDay) => (
                  <div
                    key={formatDate(displayDay, 'yyyyMMdd')}
                    className="flex-1 relative"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    <div className="absolute inset-0 flex">
                      {HOURS.map((_, i) => {
                        const midnight = isMidnightHour(HOURS[i]);
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 border-r border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors',
                              midnight && 'bg-indigo-950/20'
                            )}
                            onClick={() => handleSlotClick(room.id, displayDay, i)}
                          />
                        );
                      })}
                    </div>

                    <div className="absolute inset-0" style={{ padding: '4px 0' }}>
                      {getBookingsForRoomAndDay(room.id, displayDay).map((booking) => {
                        const segment = getBookingSegmentForBusinessDay(
                          new Date(booking.startTime),
                          new Date(booking.endTime),
                          displayDay
                        );
                        if (!segment) return null;

                        const pos = getTimePositionPercent(segment.start, segment.end, displayDay);
                        const overnight = isOvernightBooking(booking);
                        const continuesFromPrev = isBefore(new Date(booking.startTime), getBusinessDayStart(displayDay));
                        const continuesToNext = isAfter(new Date(booking.endTime), getBusinessDayEnd(displayDay));
                        const customer = customers.find((c) => c.id === booking.customerId);

                        return (
                          <div
                            key={`${booking.id}-${formatDate(displayDay)}`}
                            className="absolute top-1 bottom-1 cursor-pointer group"
                            style={{
                              left: `${pos.left}%`,
                              width: `${pos.width}%`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                              if (onEditBooking) {
                                onEditBooking(booking.id);
                              } else {
                                setIsBookingModalOpen(true, new Date(booking.startTime));
                              }
                            }}
                          >
                            <div className={cn(
                              'h-full rounded-md px-2 py-1 overflow-hidden text-xs border-l-[3px] transition-all',
                              'hover:shadow-lg hover:brightness-110',
                              booking.status === 'cancelled'
                                ? 'bg-gray-700/40 border-gray-500 line-through opacity-60'
                                : booking.status === 'in_use'
                                  ? 'bg-green-900/60 border-green-400'
                                  : booking.status === 'arrived'
                                    ? 'bg-cyan-900/60 border-cyan-400'
                                    : booking.status === 'confirmed'
                                      ? 'bg-blue-900/60 border-blue-400'
                                      : booking.status === 'pending'
                                        ? 'bg-amber-900/60 border-amber-400'
                                        : booking.status === 'extended'
                                          ? 'bg-purple-900/60 border-purple-400'
                                          : booking.status === 'completed'
                                            ? 'bg-gray-700/60 border-gray-400'
                                            : 'bg-gray-700/60 border-gray-400'
                            )}>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium text-white truncate">
                                  {customer?.name || '—'}
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
                              {booking.status === 'cancelled' && (
                                <div className="text-gray-400 text-[10px]">已取消</div>
                              )}
                              {continuesFromPrev && booking.status !== 'cancelled' && (
                                <div className="text-indigo-300 text-[10px]">← 接前日</div>
                              )}
                              {continuesToNext && booking.status !== 'cancelled' && (
                                <div className="text-indigo-300 text-[10px]">续次日 →</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {filteredRooms.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                没有符合筛选条件的包厢
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
