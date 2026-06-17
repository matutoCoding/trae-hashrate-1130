import { useState } from 'react';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { BookingForm } from '@/components/booking/BookingForm';
import { BookingDetailModal } from '@/components/booking/BookingDetailModal';
import { ExtendHourModal } from '@/components/booking/ExtendHourModal';
import { StatCard } from '@/components/common/StatCard';
import { useBookingStore } from '@/stores/useBookingStore';
import {
  CalendarCheck,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';

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
    cancelBooking,
  } = useBookingStore();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);

  const selectedDate = useBookingStore((s) => s.selectedDate);
  const todayBookings = bookings.filter((b) => {
    const d = new Date(b.startTime);
    const t = selectedDate;
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  });

  const activeRooms = rooms.filter((r) => r.status === 'active');
  const inUseBookings = todayBookings.filter((b) => b.status === 'in_use');

  const todayRevenue = todayBookings.reduce(
    (sum, b) => sum + b.totalPrice + b.extraPrice,
    0
  );

  const handleBookingClick = (bookingId: string) => {
    setDetailBookingId(bookingId);
    setIsDetailOpen(true);
  };

  const handleEditFromDetail = () => {
    setIsDetailOpen(false);
    setIsBookingModalOpen(true);
  };

  const handleExtendFromDetail = () => {
    setIsDetailOpen(false);
    setIsExtendModalOpen(true);
  };

  const handleCancelFromDetail = () => {
    if (selectedBooking) {
      cancelBooking(selectedBooking.id);
      setIsDetailOpen(false);
      setSelectedBooking(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="当日预订"
          value={todayBookings.length}
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
          value={`¥${todayRevenue.toLocaleString()}`}
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

      <ScheduleCalendar
        onAddBooking={(roomId, time) => {
          if (time) {
            setIsBookingModalOpen(true, time);
          } else {
            setIsBookingModalOpen(true);
          }
        }}
        onEditBooking={handleBookingClick}
      />

      <BookingForm
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          useBookingStore.getState().setSelectedBooking(null);
        }}
      />

      {detailBookingId && (
        <BookingDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setDetailBookingId(null);
            setSelectedBooking(null);
          }}
          bookingId={detailBookingId}
          onEdit={handleEditFromDetail}
          onExtend={handleExtendFromDetail}
          onCancel={handleCancelFromDetail}
        />
      )}

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
