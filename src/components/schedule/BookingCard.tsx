import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatTime, formatDate, formatMoney } from '@/utils/dateUtils';
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getRoomTypeLabel,
} from '@/utils/priceUtils';
import { Clock, User, Users, Package, DollarSign, Edit, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface BookingCardProps {
  bookingId: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onExtend?: () => void;
}

export function BookingCard({ bookingId, onEdit, onCancel, onExtend }: BookingCardProps) {
  const booking = useBookingStore((state) =>
    state.bookings.find((b) => b.id === bookingId)
  );
  const room = useBookingStore((state) =>
    state.rooms.find((r) => r.id === booking?.roomId)
  );
  const customer = useCustomerStore((state) =>
    state.customers.find((c) => c.id === booking?.customerId)
  );
  const pkg = useBookingStore((state) =>
    state.packages.find((p) => p.id === booking?.packageId)
  );
  
  if (!booking || !room) return null;
  
  const statusColor = getBookingStatusColor(booking.status);
  
  return (
    <div
      className={`
        relative rounded-lg p-3 cursor-pointer transition-all duration-200
        hover:scale-[1.02] hover:shadow-lg border-l-4
        ${statusColor} bg-gray-800/80 backdrop-blur
      `}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-white">{room.name}</h4>
          <p className="text-xs text-gray-400">{getRoomTypeLabel(room.type)} · {room.capacity}人</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor} text-white`}>
          {getBookingStatusLabel(booking.status)}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Clock className="w-3 h-3" />
          <span>
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
        </div>
        
        {customer && (
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <User className="w-3 h-3" />
            <span>{customer.name}</span>
            <span className="text-gray-500">·</span>
            <span>{booking.peopleCount}人</span>
          </div>
        )}
        
        {pkg && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Package className="w-3 h-3" />
            <span>{pkg.name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-green-400">
          <DollarSign className="w-3 h-3" />
          <span>{formatMoney(booking.totalPrice + booking.extraPrice)}</span>
          {booking.extraHours > 0 && (
            <span className="text-purple-400">(含续钟{booking.extraHours}小时)</span>
          )}
        </div>
      </div>
      
      {booking.isRecurring && (
        <div className="absolute top-2 right-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30">
            周期
          </span>
        </div>
      )}
    </div>
  );
}
