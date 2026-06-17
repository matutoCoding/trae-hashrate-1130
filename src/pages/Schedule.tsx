import { useState, useMemo } from 'react';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { BookingForm } from '@/components/booking/BookingForm';
import { BookingDetailModal } from '@/components/booking/BookingDetailModal';
import { ExtendHourModal } from '@/components/booking/ExtendHourModal';
import { StatCard } from '@/components/common/StatCard';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import {
  CalendarCheck,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CreditCard,
  ListTodo,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { formatTime, formatMoney } from '@/utils/dateUtils';
import {
  getBookingStatusColor,
  getBookingStatusLabel,
  getRoomTypeLabel,
} from '@/utils/priceUtils';
import { cn } from '@/lib/utils';
import { Booking, PaymentMethod, BookingStatus } from '@/types';
import { isSameDay, startOfDay } from 'date-fns';

type KanbanGroup = 'pending' | 'arrived' | 'in_use' | 'to_checkout';

interface KanbanBooking {
  booking: Booking;
  group: KanbanGroup;
}

function getKanbanGroup(booking: Booking): KanbanGroup | null {
  switch (booking.status) {
    case 'pending':
      return 'pending';
    case 'confirmed':
    case 'arrived':
      return 'arrived';
    case 'in_use':
    case 'extended':
      return 'in_use';
    default:
      return null;
  }
}

const KANBAN_GROUPS: { id: KanbanGroup; label: string; icon: any; color: string }[] = [
  { id: 'pending', label: '待确认', icon: AlertCircle, color: 'bg-amber-500' },
  { id: 'arrived', label: '已到店', icon: CheckCircle2, color: 'bg-cyan-500' },
  { id: 'in_use', label: '使用中', icon: Clock3, color: 'bg-green-500' },
  { id: 'to_checkout', label: '待结账', icon: CreditCard, color: 'bg-purple-500' },
];

export default function Schedule() {
  const {
    isBookingModalOpen,
    setIsBookingModalOpen,
    isExtendModalOpen,
    setIsExtendModalOpen,
    selectedBooking,
    setSelectedBooking,
    bookings,
    rooms,
    selectedDate,
    confirmArrival,
    checkIn,
    completeBooking,
    cancelBooking,
  } = useBookingStore();
  const { customers } = useCustomerStore();

  const [showKanban, setShowKanban] = useState(true);

  const today = startOfDay(selectedDate);

  const todayBookings = useMemo(() => {
    return bookings.filter((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const dayStart = startOfDay(selectedDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      return start <= dayEnd && end >= dayStart;
    });
  }, [bookings, selectedDate]);

  const activeRooms = rooms.filter((r) => r.status === 'active');
  const inUseBookings = todayBookings.filter((b) => b.status === 'in_use' || b.status === 'extended');

  const todayRevenue = todayBookings
    .filter((b) => b.settlement)
    .reduce((sum, b) => sum + (b.settlement?.totalAmount || 0), 0);

  const kanbanData = useMemo(() => {
    const groups: Record<KanbanGroup, KanbanBooking[]> = {
      pending: [],
      arrived: [],
      in_use: [],
      to_checkout: [],
    };

    todayBookings.forEach((b) => {
      const group = getKanbanGroup(b);
      if (group) {
        groups[group].push({ booking: b, group });
      }
    });

    const now = new Date();
    todayBookings.forEach((b) => {
      if ((b.status === 'in_use' || b.status === 'extended') && b.endTime && now > new Date(b.endTime)) {
        groups.to_checkout.push({ booking: b, group: 'to_checkout' });
      }
    });

    return groups;
  }, [todayBookings]);

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleEditFromDetail = () => {
    setIsBookingModalOpen(true, new Date(selectedBooking?.startTime || selectedDate));
  };

  const handleExtendFromDetail = () => {
    setIsExtendModalOpen(true);
  };

  const handleArrival = () => {
    if (selectedBooking) {
      confirmArrival(selectedBooking.id);
    }
  };

  const handleCheckIn = () => {
    if (selectedBooking) {
      checkIn(selectedBooking.id);
    }
  };

  const handleComplete = (params: {
    paymentMethod: PaymentMethod;
    discount: number;
    rounding: number;
    pointsUsed: number;
    notes?: string;
  }) => {
    if (selectedBooking) {
      completeBooking(selectedBooking.id, params);
    }
  };

  const handleCancel = (reason: string) => {
    if (selectedBooking) {
      cancelBooking(selectedBooking.id, reason);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="当日预订"
          value={todayBookings.filter(b => b.status !== 'cancelled').length}
          subtitle="单"
          icon={<CalendarCheck className="w-5 h-5" />}
          color="purple"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="使用中包厢"
          value={`${inUseBookings.length}/${activeRooms.length}`}
          subtitle="间"
          icon={<Clock className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="当日营收"
          value={`¥${formatMoney(todayRevenue)}`}
          subtitle="元"
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="服务客户"
          value={todayBookings.reduce((sum, b) => sum + b.peopleCount, 0)}
          subtitle="人"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {showKanban && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">今日到店看板</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowKanban(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {KANBAN_GROUPS.map((group) => {
                const Icon = group.icon;
                const groupBookings = kanbanData[group.id];
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', group.color)} />
                      <span className="text-sm font-medium text-gray-300">{group.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        {groupBookings.length}
                      </span>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {groupBookings.map(({ booking }) => {
                        const customer = customers.find((c) => c.id === booking.customerId);
                        const room = rooms.find((r) => r.id === booking.roomId);
                        if (!customer || !room) return null;

                        const canArrive = group.id === 'pending';
                        const canCheckIn = group.id === 'arrived';
                        const canCheckout = group.id === 'in_use' || group.id === 'to_checkout';

                        return (
                          <div
                            key={booking.id}
                            className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => openDetail(booking)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white truncate">
                                {customer.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {room.name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {getRoomTypeLabel(room.type)} · {booking.peopleCount}人
                            </div>
                            <div className="flex gap-1 mt-2">
                              {canArrive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmArrival(booking.id);
                                  }}
                                  className="flex-1 h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
                                >
                                  到店
                                </button>
                              )}
                              {canCheckIn && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    checkIn(booking.id);
                                  }}
                                  className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                                >
                                  开房
                                </button>
                              )}
                              {canCheckout && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(booking);
                                  }}
                                  className="flex-1 h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
                                >
                                  结账
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(booking);
                                }}
                                className="h-7 w-7 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded flex items-center justify-center transition-colors"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {groupBookings.length === 0 && (
                        <div className="h-16 flex items-center justify-center text-xs text-gray-600">
                          暂无
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!showKanban && (
        <Button variant="ghost" size="sm" onClick={() => setShowKanban(true)}>
          <ListTodo className="w-4 h-4" />
          展开今日到店看板
        </Button>
      )}

      <ScheduleCalendar
        onAddBooking={(roomId, time) => {
          setSelectedBooking(null);
          if (roomId) {
            setIsBookingModalOpen(true, time);
          } else if (time) {
            setIsBookingModalOpen(true, time);
          } else {
            setIsBookingModalOpen(true);
          }
        }}
        onEditBooking={(bookingId) => {
          const b = bookings.find((x) => x.id === bookingId);
          if (b) openDetail(b);
        }}
      />

      <BookingForm
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedBooking(null);
        }}
      />

      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onEdit={handleEditFromDetail}
        onExtend={handleExtendFromDetail}
        onArrival={handleArrival}
        onCheckIn={handleCheckIn}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />

      {selectedBooking && (
        <ExtendHourModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          bookingId={selectedBooking.id}
        />
      )}
    </div>
  );
}
