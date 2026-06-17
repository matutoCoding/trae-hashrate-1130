import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatTime, formatDate, formatDateTime, formatDuration } from '@/utils/dateUtils';
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
  Hash,
  Repeat,
  Check,
  DoorOpen,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { isSameDay, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { differenceInHours } from 'date-fns';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onEdit?: () => void;
  onExtend?: () => void;
}

export function BookingDetailModal({ isOpen, onClose, bookingId, onEdit, onExtend }: BookingDetailModalProps) {
  const {
    bookings,
    rooms,
    packages,
    cancelBooking,
    confirmArrival,
    checkIn,
    completeBooking,
  } = useBookingStore();
  const { customers } = useCustomerStore();

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const booking = bookings.find((b) => b.id === bookingId);
  const room = rooms.find((r) => r.id === booking?.roomId);
  const pkg = packages.find((p) => p.id === booking?.packageId);
  const customer = customers.find((c) => c.id === booking?.customerId);
  const recurringRule = useCustomerStore((s) =>
    booking?.recurringRuleId ? s.recurringRules.find((r) => r.id === booking.recurringRuleId) : null
  );

  if (!booking || !room) return null;

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const isOvernight = !isSameDay(startTime, endTime);
  const totalMinutes = differenceInMinutes(endTime, startTime);
  const durationHours = totalMinutes / 60;

  const extraHours = booking.extraHours || 0;
  const totalDuration = durationHours + extraHours;

  const baseRoomFee = durationHours * room.pricePerHour;
  const packageFee = pkg?.price || 0;
  const baseTotal = Math.round(baseRoomFee + packageFee);
  const extraFee = booking.extraPrice || 0;
  const grandTotal = booking.totalPrice + extraFee;

  const earnedPoints = Math.floor(grandTotal / 10);

  const statusColor = getBookingStatusColor(booking.status);

  const canArrive = booking.status === 'pending' || booking.status === 'confirmed';
  const canCheckIn = booking.status === 'arrived' || booking.status === 'confirmed';
  const canComplete = booking.status === 'in_use' || booking.status === 'extended';

  const handleConfirmArrival = () => {
    confirmArrival(booking.id);
  };

  const handleCheckIn = () => {
    checkIn(booking.id);
  };

  const handleShowCheckout = () => {
    setShowCheckout(true);
  };

  const handleComplete = () => {
    completeBooking(booking.id);
    setShowCheckout(false);
  };

  const handleConfirmCancel = () => {
    cancelBooking(booking.id, cancelReason || '手动取消');
    setShowCancelForm(false);
    setCancelReason('');
  };

  const statusIcon = () => {
    switch (booking.status) {
      case 'pending':
      case 'confirmed':
        return <Clock className="w-5 h-5" />;
      case 'arrived':
        return <Check className="w-5 h-5" />;
      case 'in_use':
      case 'extended':
        return <DoorOpen className="w-5 h-5" />;
      case 'completed':
        return <CreditCard className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={showCheckout ? '结账结算' : '预订详情'} size="lg">
      {showCheckout ? (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-10 h-10 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-green-400">结账确认</h3>
                <p className="text-sm text-green-200/70">确认完成本次消费并结算</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">包厢</span>
              <span className="text-white">{room.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">客户</span>
              <span className="text-white">{customer?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">使用时长</span>
              <span className="text-white">{formatDuration(totalDuration)}</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">基础包厢费 ({formatDuration(durationHours)} × ¥{room.pricePerHour})</span>
              <span className="text-white">¥{Math.round(baseRoomFee)}</span>
            </div>
            {pkg && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">套餐费 ({pkg.name})</span>
                <span className="text-white">¥{packageFee}</span>
              </div>
            )}
            {extraFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">续钟费 ({extraHours}小时)</span>
                <span className="text-purple-400">¥{extraFee}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="text-white font-medium">应收总额</span>
              <span className="text-green-400 font-bold text-2xl">¥{grandTotal}</span>
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
              +{earnedPoints}
            </div>
            <div>
              <p className="text-sm text-purple-300 font-medium">本次消费将获得积分</p>
              <p className="text-xs text-purple-200/60">
                按消费金额每10元累计1积分
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setShowCheckout(false)}>
              返回
            </Button>
            <Button variant="primary" fullWidth onClick={handleComplete}>
              <CreditCard className="w-4 h-4" />
              确认结账完成
            </Button>
          </div>
        </div>
      ) : showCancelForm ? (
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">取消预订</p>
              <p className="text-red-200/70 text-xs mt-1">
                取消后预订状态将更新，客户将失去该时段预订资格
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">取消原因（可选）</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="请输入取消原因..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => {
              setShowCancelForm(false);
              setCancelReason('');
            }}>
              不取消
            </Button>
            <Button variant="danger" fullWidth onClick={handleConfirmCancel}>
              确认取消预订
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', statusColor)}>
                {statusIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                <p className="text-xs text-gray-400">
                  {getRoomTypeLabel(room.type)} · {room.capacity}人 · ¥{room.pricePerHour}/小时
                </p>
              </div>
            </div>
            <span className={cn('text-sm px-3 py-1 rounded-full font-medium text-white', statusColor)}>
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
                  <span className={cn('text-xs px-2 py-0.5 rounded-full inline-block mt-1', getMemberLevelColor(customer.memberLevel))}>
                    {getMemberLevelLabel(customer.memberLevel)}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    累计消费 ¥{customer.totalSpent} · {customer.visitCount}次
                  </p>
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
              <p className="text-2xl font-bold text-white">
                {booking.peopleCount} <span className="text-sm text-gray-400">人</span>
              </p>
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
                <span className="text-white">
                  {formatDuration(durationHours)}
                  {extraHours > 0 && (
                    <span className="text-purple-400 ml-1">(+续钟{extraHours}h = {formatDuration(totalDuration)})</span>
                  )}
                </span>
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
                <span className="text-gray-400">包厢费 ({formatDuration(durationHours)} × ¥{room.pricePerHour})</span>
                <span className="text-white">¥{Math.round(baseRoomFee)}</span>
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
                  <span className="text-gray-400">续钟费 ({extraHours}小时)</span>
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

          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-3">
              <p className="text-xs text-cyan-400 font-medium mb-2">履约操作</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canArrive}
                  onClick={handleConfirmArrival}
                >
                  <Check className="w-4 h-4" />
                  确认到店
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canCheckIn}
                  onClick={handleCheckIn}
                >
                  <DoorOpen className="w-4 h-4" />
                  开房使用中
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!canComplete}
                  onClick={handleShowCheckout}
                >
                  <CreditCard className="w-4 h-4" />
                  结账完成
                </Button>
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
                {onExtend && (booking.status === 'in_use' || booking.status === 'extended' || booking.status === 'confirmed' || booking.status === 'arrived') && (
                  <Button variant="outline" fullWidth onClick={onExtend}>
                    <PlusCircle className="w-4 h-4" />
                    续钟
                  </Button>
                )}
                <Button variant="danger" fullWidth onClick={() => setShowCancelForm(true)}>
                  <XCircle className="w-4 h-4" />
                  取消预订
                </Button>
              </>
            )}
            <Button variant="ghost" fullWidth onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
