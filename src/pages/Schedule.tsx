import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { BookingForm } from '@/components/booking/BookingForm';
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
    bookings,
    rooms,
  } = useBookingStore();
  
  const todayBookings = bookings.filter(
    (b) =>
      new Date(b.startTime).toDateString() === new Date().toDateString()
  );
  
  const activeRooms = rooms.filter((r) => r.status === 'active');
  const inUseBookings = todayBookings.filter((b) => b.status === 'in_use');
  
  const todayRevenue = todayBookings.reduce(
    (sum, b) => sum + b.totalPrice + b.extraPrice,
    0
  );
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="今日预订"
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
          title="今日营收"
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
        onAddBooking={() => setIsBookingModalOpen(true)}
      />
      
      <BookingForm
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          useBookingStore.getState().setSelectedBooking(null);
        }}
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
