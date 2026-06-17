import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { PackageSelector } from '../booking/PackageSelector';
import { formatTime, formatMoney, formatDateTime } from '@/utils/dateUtils';
import { User, Clock, Users, Package as PackageIcon, Calendar, AlertTriangle } from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { getBookingStatusLabel, getMemberLevelLabel, getMemberLevelColor } from '@/utils/priceUtils';

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking | null;
  defaultRoomId?: string;
  defaultStartTime?: Date;
}

export function BookingForm({ isOpen, onClose, booking, defaultRoomId, defaultStartTime }: BookingFormProps) {
  const { rooms, addBooking, updateBooking, cancelBooking, selectedBooking, modalBaseDate, checkConflict, bookings } = useBookingStore();
  const { customers } = useCustomerStore();

  const currentBooking = booking || selectedBooking;

  const [formData, setFormData] = useState({
    roomId: '',
    customerId: '',
    startTime: '14:00',
    endTime: '17:00',
    peopleCount: 4,
    packageId: '',
    status: 'confirmed' as BookingStatus,
    remarks: '',
    isRecurring: false,
  });

  const [conflictBooking, setConflictBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConflictBooking(null);
      if (currentBooking) {
        setFormData({
          roomId: currentBooking.roomId,
          customerId: currentBooking.customerId,
          startTime: formatTime(new Date(currentBooking.startTime)),
          endTime: formatTime(new Date(currentBooking.endTime)),
          peopleCount: currentBooking.peopleCount,
          packageId: currentBooking.packageId || '',
          status: currentBooking.status,
          remarks: currentBooking.remarks || '',
          isRecurring: currentBooking.isRecurring,
        });
      } else {
        const baseDate = modalBaseDate || new Date();
        const start = defaultStartTime || baseDate;
        const end = defaultStartTime
          ? new Date(defaultStartTime.getTime() + 3 * 60 * 60 * 1000)
          : new Date(baseDate.getTime() + 3 * 60 * 60 * 1000);

        setFormData({
          roomId: defaultRoomId || rooms[0]?.id || '',
          customerId: customers[0]?.id || '',
          startTime: formatTime(start),
          endTime: formatTime(end),
          peopleCount: 4,
          packageId: '',
          status: 'confirmed',
          remarks: '',
          isRecurring: false,
        });
      }
    }
  }, [currentBooking, isOpen, defaultRoomId, defaultStartTime]);

  const selectedRoom = rooms.find((r) => r.id === formData.roomId);
  const selectedPackage = useBookingStore((state) =>
    state.packages.find((p) => p.id === formData.packageId)
  );

  const calculateHours = () => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;
    return (endMinutes - startMinutes) / 60;
  };

  const calculatePrice = () => {
    if (!selectedRoom) return 0;
    const hours = calculateHours();
    return Math.round(hours * selectedRoom.pricePerHour + (selectedPackage?.price || 0));
  };

  const isOvernight = () => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    return (endH * 60 + endM) <= (startH * 60 + startM);
  };

  const buildDates = () => {
    const baseDate = currentBooking
      ? new Date(currentBooking.startTime)
      : (modalBaseDate || new Date());
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const startDate = new Date(baseDate);
    startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date(baseDate);
    endDate.setHours(endH, endM, 0, 0);
    if (isOvernight()) endDate.setDate(endDate.getDate() + 1);
    return { startDate, endDate };
  };

  useEffect(() => {
    if (!isOpen || !formData.roomId) {
      setConflictBooking(null);
      return;
    }
    const { startDate, endDate } = buildDates();
    const conflict = checkConflict(formData.roomId, startDate, endDate, currentBooking?.id);
    setConflictBooking(conflict);
  }, [formData.roomId, formData.startTime, formData.endTime, isOpen, currentBooking?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { startDate, endDate } = buildDates();

    if (currentBooking) {
      updateBooking(currentBooking.id, {
        roomId: formData.roomId,
        customerId: formData.customerId,
        startTime: startDate,
        endTime: endDate,
        peopleCount: formData.peopleCount,
        packageId: formData.packageId || undefined,
        status: formData.status,
        remarks: formData.remarks,
      });
    } else {
      addBooking({
        roomId: formData.roomId,
        customerId: formData.customerId,
        startTime: startDate,
        endTime: endDate,
        peopleCount: formData.peopleCount,
        packageId: formData.packageId || undefined,
        status: formData.status,
        remarks: formData.remarks,
        isRecurring: formData.isRecurring,
      });
    }
    onClose();
  };

  const handleCancelBooking = () => {
    if (currentBooking) {
      cancelBooking(currentBooking.id);
      onClose();
    }
  };

  const conflictCustomer = conflictBooking
    ? customers.find((c) => c.id === conflictBooking.customerId)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentBooking ? '编辑预订' : '新增预订'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {conflictBooking && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-400 font-medium text-sm">时段冲突</p>
              <p className="text-red-200/80 text-xs mt-1">
                该包厢此时段已有预订：{conflictCustomer?.name || '未知客户'}{' '}
                {formatDateTime(new Date(conflictBooking.startTime))} - {formatTime(new Date(conflictBooking.endTime))}
                {conflictBooking.status === 'in_use' && '（使用中）'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Calendar className="inline w-4 h-4 mr-1" />
              选择包厢
            </label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {rooms.filter((r) => r.status === 'active').map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - ¥{room.pricePerHour}/小时
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              客户
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Clock className="inline w-4 h-4 mr-1" />
              开始时间
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Clock className="inline w-4 h-4 mr-1" />
              结束时间
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              <Users className="inline w-4 h-4 mr-1" />
              人数
            </label>
            <input
              type="number"
              min="1"
              value={formData.peopleCount}
              onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">预订状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="in_use">使用中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            <PackageIcon className="inline w-4 h-4 mr-1" />
            酒水套餐
          </label>
          <PackageSelector
            selectedId={formData.packageId}
            onSelect={(pkgId) => setFormData({ ...formData, packageId: pkgId })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">备注</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={2}
            placeholder="添加备注信息..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">预计费用</p>
            <p className="text-2xl font-bold text-green-400">
              {formatMoney(calculatePrice())}
            </p>
          </div>
          {selectedRoom && (
            <div className="text-right text-sm text-gray-400">
              <p>{selectedRoom.name}</p>
              <p>¥{selectedRoom.pricePerHour}/小时 × {calculateHours().toFixed(1)}小时</p>
              {selectedPackage && <p>+ {selectedPackage.name} ¥{selectedPackage.price}</p>}
              {isOvernight() && (
                <p className="text-amber-400 mt-1">跨夜时段 (+1天)</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {currentBooking ? (
            <Button type="button" variant="danger" onClick={handleCancelBooking}>
              取消预订
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={!!conflictBooking}>
              {currentBooking ? '保存修改' : '确认预订'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
