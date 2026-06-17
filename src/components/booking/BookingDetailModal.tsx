import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatTime, formatDate, formatMoney, formatDateTime, formatDuration } from '@/utils/dateUtils';
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getRoomTypeLabel,
  getMemberLevelLabel,
  getMemberLevelColor,
} from '@/utils/priceUtils';
import {
  Clock,
  User,
  Users,
  Package,
  DollarSign,
  Music,
  Moon,
  Edit,
  PlusCircle,
  XCircle,
  Calendar,
  Hash,
  Repeat,
} from 'lucide-react';
import { isSameDay, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onEdit?: () => void;
  onExtend?: () => void;
  onCancel?: () => void;
}

export function BookingDetailModal({ isOpen, onClose, bookingId, onEdit, onExtend, onCancel }: BookingDetailModalProps) {
  const booking = useBookingStore((s) => s.bookings.find((b) => b.id === bookingId));
  const room = useBookingStore((s) => s.rooms.find((r) => r.id === booking?.roomId));
  const pkg = useBookingStore((s) => s.packages.find((p) => p.id === booking?.packageId));
  const customer = useCustomerStore((s) => s.customers.find((c) => c.id === booking?.customerId));
  const recurringRule = useCustomerStore((s) =>
    booking?.recurringRuleId ? s.recurringRules.find((r) => r.id === booking.recurringRuleId) : null
  );

  if (!booking || !room) return null;

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const isOvernight = !isSameDay(startTime, endTime);
  const totalMinutes = differenceInMinutes(endTime, startTime);
  const durationHours = totalMinutes / 60;

  const roomFee = durationHours * room.pricePerHour;
  const packageFee = pkg?.price || 0;
  const baseTotal = Math.round(roomFee + packageFee);
  const extraFee = booking.extraPrice;
  const grandTotal = booking.totalPrice + booking.extraPrice;

  const statusColor = getBookingStatusColor(booking.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="预订详情" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', statusColor)}>
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{room.name}</h3>
              <p className="text-xs text-gray-400">{getRoomTypeLabel(room.type)} · {room.capacity}人 · ¥{room.pricePerHour}/小时</p>
            </div>
          </div>
          <span className={cn('text-sm px-3 py-1 rounded-full font-medium', statusColor, 'text-white')}>
            {getBookingStatusLabel(booking.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">客户信息</span>
            </div>
            {customer ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{customer.name}</p>
                <p className="text-xs text-gray-400">{customer.phone}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', getMemberLevelColor(customer.memberLevel))}>
                  {getMemberLevelLabel(customer.memberLevel)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">未知客户</p>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">到场人数</span>
            </div>
            <p className="text-2xl font-bold text-white">{booking.peopleCount} <span className="text-sm text-gray-400">人</span></p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">预订时段</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">开始</span>
              <span className="text-white">{formatDateTime(startTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">结束</span>
              <span className="text-white">{formatDateTime(endTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">时长</span>
              <span className="text-white">{formatDuration(durationHours)}</span>
            </div>
            {isOvernight && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 mt-2">
                <Moon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">跨夜时段</p>
                  <p className="text-xs text-amber-200/70">
                    从 {formatDate(startTime, 'MM月dd日')} 延续至 {formatDate(endTime, 'MM月dd日')}凌晨
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {pkg && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">酒水套餐</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white font-medium">{pkg.name}</span>
                <span className="text-amber-400">¥{pkg.price}</span>
              </div>
              <p className="text-xs text-gray-400">{pkg.description}</p>
              {pkg.items && pkg.items.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {pkg.items.map((item, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                      {item.name} × {item.quantity}{item.unit}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">费用明细</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">包厢费 ({formatDuration(durationHours)})</span>
              <span className="text-white">¥{Math.round(roomFee)}</span>
            </div>
            {packageFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">套餐费 ({pkg?.name})</span>
                <span className="text-white">¥{packageFee}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-700 pt-1">
              <span className="text-gray-400">基础合计</span>
              <span className="text-white">¥{baseTotal}</span>
            </div>
            {extraFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">续钟费 ({booking.extraHours}小时)</span>
                <span className="text-purple-400">+¥{extraFee}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-700 pt-1">
              <span className="text-white font-medium">总计</span>
              <span className="text-green-400 font-bold text-lg">¥{grandTotal}</span>
            </div>
          </div>
        </div>

        {booking.isRecurring && recurringRule && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300">周期预订</span>
            </div>
            <p className="text-sm text-purple-200">
              关联规则：{recurringRule.customerName} / {recurringRule.roomName}
            </p>
          </div>
        )}

        {booking.remarks && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">备注</span>
            </div>
            <p className="text-sm text-gray-300">{booking.remarks}</p>
          </div>
        )}

        {booking.status === 'cancelled' && booking.cancelTime && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400">取消记录</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">取消时间</span>
                <span className="text-red-300">{formatDateTime(new Date(booking.cancelTime))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">取消原因</span>
                <span className="text-red-300">{booking.cancelReason || '手动取消'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <>
              {onEdit && (
                <Button variant="outline" fullWidth onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                  编辑
                </Button>
              )}
              {onExtend && booking.status !== 'pending' && (
                <Button variant="outline" fullWidth onClick={onExtend}>
                  <PlusCircle className="w-4 h-4" />
                  续钟
                </Button>
              )}
              {onCancel && (
                <Button variant="danger" fullWidth onClick={onCancel}>
                  <XCircle className="w-4 h-4" />
                  取消预订
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" fullWidth onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
}
