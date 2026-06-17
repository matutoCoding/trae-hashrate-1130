import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBookingStore } from '@/stores/useBookingStore';
import { formatMoney, formatTime } from '@/utils/dateUtils';
import { calculateExtraPrice } from '@/utils/priceUtils';
import { Clock, Plus, Minus } from 'lucide-react';

interface ExtendHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

export function ExtendHourModal({ isOpen, onClose, bookingId }: ExtendHourModalProps) {
  const { bookings, rooms, extendBooking } = useBookingStore();
  const [hours, setHours] = useState(1);
  
  const booking = bookings.find((b) => b.id === bookingId);
  const room = booking ? rooms.find((r) => r.id === booking.roomId) : null;
  
  if (!booking || !room) return null;
  
  const extraPrice = calculateExtraPrice(room, hours);
  const newEndTime = new Date(booking.endTime);
  newEndTime.setHours(newEndTime.getHours() + hours);
  
  const handleConfirm = () => {
    extendBooking(bookingId, hours);
    onClose();
    setHours(1);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="续钟" size="sm">
      <div className="space-y-4">
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-1">当前结束时间</p>
          <p className="text-lg font-medium text-white">
            {formatTime(new Date(booking.endTime))}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setHours(Math.max(1, hours - 1))}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{hours}</p>
            <p className="text-sm text-gray-500">小时</p>
          </div>
          
          <button
            onClick={() => setHours(hours + 1)}
            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hours === h
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {h}小时
            </button>
          ))}
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">续钟费用</span>
            <span className="text-xl font-bold text-amber-400">
              {formatMoney(extraPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>单价 (1.2倍)</span>
            <span>¥{Math.round(room.pricePerHour * 1.2)}/小时</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
            <span>新结束时间</span>
            <span>{formatTime(newEndTime)}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={onClose}>
            取消
          </Button>
          <Button fullWidth onClick={handleConfirm}>
            确认续钟
          </Button>
        </div>
      </div>
    </Modal>
  );
}
