import { useState, useMemo } from 'react';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { formatDate, formatDateTime, formatDuration, formatMoney } from '@/utils/dateUtils';
import { formatPaymentMethod } from '@/utils/businessHours';
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getRoomTypeLabel,
  getMemberLevelLabel,
} from '@/utils/priceUtils';
import { Booking, PaymentMethod } from '@/types';
import { isSameDay, differenceInMinutes } from 'date-fns';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  X,
  Edit3,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Users,
  Calendar,
  Tag,
  FileText,
  ArrowRight,
  Coins,
  Percent,
  Scissors,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'detail' | 'checkout' | 'cancel';

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
  onEdit: () => void;
  onExtend: () => void;
  onArrival: () => void;
  onCheckIn: () => void;
  onComplete: (params: {
    paymentMethod: PaymentMethod;
    discount: number;
    rounding: number;
    pointsUsed: number;
    notes?: string;
  }) => void;
  onCancel: (reason: string) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: '现金', icon: '¥' },
  { value: 'wechat', label: '微信', icon: '💬' },
  { value: 'alipay', label: '支付宝', icon: '📱' },
  { value: 'card', label: '银行卡', icon: '💳' },
  { value: 'points', label: '积分抵扣', icon: '🎁' },
  { value: 'credit', label: '挂账', icon: '📋' },
];

export function BookingDetailModal({
  booking,
  onClose,
  onEdit,
  onExtend,
  onArrival,
  onCheckIn,
  onComplete,
  onCancel,
}: BookingDetailModalProps) {
  const { rooms, packages } = useBookingStore();
  const { customers } = useCustomerStore();

  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [cancelReason, setCancelReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [discount, setDiscount] = useState(0);
  const [rounding, setRounding] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [notes, setNotes] = useState('');

  const room = booking ? rooms.find((r) => r.id === booking.roomId) : null;
  const customer = booking ? customers.find((c) => c.id === booking.customerId) : null;
  const pkg = booking?.packageId ? packages.find((p) => p.id === booking.packageId) : null;

  const isOvernight = booking && !isSameDay(new Date(booking.startTime), new Date(booking.endTime));

  const totalHours = booking
    ? Math.ceil(differenceInMinutes(new Date(booking.endTime), new Date(booking.startTime)) / 60)
    : 0;

  const basePrice = booking?.totalPrice || 0;
  const extraPrice = booking?.extraPrice || 0;
  const subtotal = basePrice + extraPrice;

  const finalAmount = Math.max(subtotal - discount - rounding - pointsUsed, 0);
  const pointsEarned = Math.floor(finalAmount / 10);
  const maxPointsUsable = customer ? Math.min(customer.points, subtotal) : 0;

  const canConfirmArrival = booking && (booking.status === 'pending' || booking.status === 'confirmed');
  const canCheckIn = booking && (booking.status === 'confirmed' || booking.status === 'arrived');
  const canComplete = booking && (booking.status === 'in_use' || booking.status === 'extended');
  const canEdit = booking && ['pending', 'confirmed', 'arrived'].includes(booking.status);
  const canExtend = booking && ['confirmed', 'arrived', 'in_use', 'extended'].includes(booking.status);
  const canCancel = booking && !['completed', 'cancelled'].includes(booking.status);

  const handleComplete = () => {
    if (!booking) return;
    onComplete({
      paymentMethod,
      discount,
      rounding,
      pointsUsed,
      notes: notes || undefined,
    });
    setViewMode('detail');
    setDiscount(0);
    setRounding(0);
    setPointsUsed(0);
    setNotes('');
  };

  const handleCancel = () => {
    if (!booking) return;
    onCancel(cancelReason || '手动取消');
    setViewMode('detail');
    setCancelReason('');
  };

  if (!booking || !room || !customer) return null;

  const renderDetailView = () => (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold',
            getBookingStatusColor(booking.status)
          )}>
            {customer.name[0]}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{customer.name}</h3>
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium text-white',
                getBookingStatusColor(booking.status)
              )}>
                {getBookingStatusLabel(booking.status)}
              </span>
              {booking.isRecurring && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-600/30 text-purple-300">
                  周期预订
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <User className="w-3 h-3" /> 客户信息
          </div>
          <div className="text-white text-sm font-medium">{customer.name}</div>
          <div className="text-gray-400 text-xs flex items-center gap-1">
            <Phone className="w-3 h-3" /> {customer.phone}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {getMemberLevelLabel(customer.memberLevel)} · 累计 ¥{formatMoney(customer.totalSpent)}
          </div>
          <div className="text-yellow-400 text-xs">
            积分 {customer.points}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <Users className="w-3 h-3" /> 包厢信息
          </div>
          <div className="text-white text-sm font-medium">{room.name}</div>
          <div className="text-gray-400 text-xs">
            {getRoomTypeLabel(room.type)} · {room.capacity}人
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            到场人数 {booking.peopleCount} 人
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
          <Calendar className="w-3 h-3" /> 预订时段
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-white text-sm font-medium">
              {formatDateTime(new Date(booking.startTime))}
            </div>
            <div className="text-gray-400 text-xs">开始</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="flex-1 text-right">
            <div className="text-white text-sm font-medium">
              {formatDateTime(new Date(booking.endTime))}
            </div>
            <div className="text-gray-400 text-xs">结束</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-400">时长: {formatDuration(totalHours * 60)}</span>
          {isOvernight && (
            <span className="px-2 py-0.5 rounded bg-amber-600/30 text-amber-300">
              跨夜时段 (+1天)
            </span>
          )}
        </div>
      </div>

      {pkg && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Tag className="w-3 h-3" /> 酒水套餐
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">{pkg.name}</div>
              <div className="text-gray-400 text-xs">{pkg.description}</div>
            </div>
            <div className="text-yellow-400 font-bold">¥{formatMoney(pkg.price)}</div>
          </div>
          {pkg.items.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700/50">
              <div className="text-xs text-gray-400">包含:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {pkg.items.map((item, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 text-xs">
                    {item.name} ×{item.quantity}{item.unit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
          <CreditCard className="w-3 h-3" /> 费用明细
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">基础包厢费 ({totalHours}h)</span>
            <span className="text-white">¥{formatMoney(basePrice)}</span>
          </div>
          {pkg && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">套餐费</span>
              <span className="text-white">¥{formatMoney(pkg.price)}</span>
            </div>
          )}
          {booking.extraHours > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">续钟费 ({booking.extraHours}h)</span>
              <span className="text-white">¥{formatMoney(extraPrice)}</span>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-gray-700/50 flex justify-between">
            <span className="text-gray-300 font-medium">小计</span>
            <span className="text-yellow-400 font-bold text-lg">¥{formatMoney(subtotal)}</span>
          </div>
        </div>
      </div>

      {booking.remarks && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
            <FileText className="w-3 h-3" /> 备注
          </div>
          <div className="text-white text-sm">{booking.remarks}</div>
        </div>
      )}

      {booking.cancelTime && (
        <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
            <XCircle className="w-3 h-3" /> 取消记录
          </div>
          <div className="text-red-300 text-sm">
            {formatDateTime(new Date(booking.cancelTime))}
          </div>
          <div className="text-red-300/80 text-xs mt-1">
            原因: {booking.cancelReason || '未填写'}
          </div>
        </div>
      )}

      {booking.settlement && (
        <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
            <CheckCircle2 className="w-3 h-3" /> 结算记录
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">结算时间</span>
              <span className="text-white">{formatDateTime(new Date(booking.settlement.settledAt))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">支付方式</span>
              <span className="text-white">{formatPaymentMethod(booking.settlement.paymentMethod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">优惠减免</span>
              <span className="text-green-400">-¥{formatMoney(booking.settlement.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">抹零</span>
              <span className="text-green-400">-¥{formatMoney(booking.settlement.rounding)}</span>
            </div>
            {booking.settlement.pointsUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">积分抵扣</span>
                <span className="text-yellow-400">-{booking.settlement.pointsUsed} 分</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-green-800/30">
              <span className="text-gray-300">应收总额</span>
              <span className="text-green-400 font-bold">¥{formatMoney(booking.settlement.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">获得积分</span>
              <span className="text-yellow-400">+{booking.settlement.pointsEarned} 分</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <div className="flex gap-2">
          {canConfirmArrival && (
            <Button onClick={onArrival} className="flex-1">
              <CheckCircle2 className="w-4 h-4" />
              确认到店
            </Button>
          )}
          {canCheckIn && (
            <Button onClick={onCheckIn} className="flex-1">
              <Clock className="w-4 h-4" />
              开房使用中
            </Button>
          )}
          {canComplete && (
            <Button onClick={() => setViewMode('checkout')} variant="success" className="flex-1">
              <CreditCard className="w-4 h-4" />
              结账完成
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="secondary" onClick={onEdit} className="flex-1">
              <Edit3 className="w-4 h-4" />
              编辑
            </Button>
          )}
          {canExtend && (
            <Button variant="secondary" onClick={onExtend} className="flex-1">
              <Clock className="w-4 h-4" />
              续钟
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setViewMode('cancel')} className="flex-1">
              <XCircle className="w-4 h-4" />
              取消预订
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCheckoutView = () => (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">结账结算</h3>
          <p className="text-gray-400 text-sm">{customer.name} · {room.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setViewMode('detail')}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="text-xs text-gray-400 mb-3">费用明细</div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">基础包厢费</span>
            <span className="text-white">¥{formatMoney(basePrice)}</span>
          </div>
          {pkg && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">套餐费</span>
              <span className="text-white">¥{formatMoney(pkg.price)}</span>
            </div>
          )}
          {booking.extraHours > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">续钟费</span>
              <span className="text-white">¥{formatMoney(extraPrice)}</span>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-gray-700/50 flex justify-between">
            <span className="text-gray-300">小计</span>
            <span className="text-white font-medium">¥{formatMoney(subtotal)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 flex items-center gap-1 mb-2">
            <Percent className="w-3 h-3" /> 优惠减免 (元)
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="输入优惠金额"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 flex items-center gap-1 mb-2">
            <Scissors className="w-3 h-3" /> 抹零 (元)
          </label>
          <div className="flex gap-2">
            {[0, 0.5, 1, 5].map((amount) => (
              <button
                key={amount}
                onClick={() => setRounding(amount)}
                className={cn(
                  'flex-1 h-10 rounded-lg text-sm transition-colors',
                  rounding === amount
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                )}
              >
                {amount === 0 ? '不抹零' : `¥${amount}`}
              </button>
            ))}
          </div>
        </div>

        {customer.points > 0 && (
          <div>
            <label className="text-xs text-gray-400 flex items-center gap-1 mb-2">
              <Coins className="w-3 h-3" /> 积分抵扣 (可用 {customer.points} 分)
            </label>
            <input
              type="number"
              value={pointsUsed}
              onChange={(e) => setPointsUsed(Math.max(0, Math.min(maxPointsUsable, Number(e.target.value) || 0)))}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="输入积分抵扣金额"
            />
            <div className="text-xs text-gray-500 mt-1">1 积分 = 1 元，最多可用 {maxPointsUsable} 分</div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 flex items-center gap-1 mb-2">
            <Wallet className="w-3 h-3" /> 支付方式
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  'h-12 rounded-lg text-sm transition-colors flex flex-col items-center justify-center',
                  paymentMethod === method.value
                    ? 'bg-purple-600 text-white border-2 border-purple-400'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-transparent'
                )}
              >
                <span className="text-lg leading-none">{method.icon}</span>
                <span className="text-xs">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 flex items-center gap-1 mb-2">
            <FileText className="w-3 h-3" /> 备注
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="可选备注"
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-700/50 rounded-xl p-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">小计</span>
            <span className="text-white">¥{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">优惠减免</span>
              <span className="text-green-400">-¥{formatMoney(discount)}</span>
            </div>
          )}
          {rounding > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">抹零</span>
              <span className="text-green-400">-¥{formatMoney(rounding)}</span>
            </div>
          )}
          {pointsUsed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">积分抵扣</span>
              <span className="text-yellow-400">-{pointsUsed} 分</span>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-purple-700/50 flex justify-between items-end">
            <span className="text-white font-medium text-base">应收总额</span>
            <span className="text-2xl font-bold text-yellow-400">¥{formatMoney(finalAmount)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-yellow-400/80 justify-end">
            <Sparkles className="w-3 h-3" />
            本次获得 {pointsEarned} 积分
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setViewMode('detail')} className="flex-1">
          返回
        </Button>
        <Button variant="success" onClick={handleComplete} className="flex-1">
          <CreditCard className="w-4 h-4" />
          确认结账完成
        </Button>
      </div>
    </div>
  );

  const renderCancelView = () => (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-red-400">取消预订</h3>
          <p className="text-gray-400 text-sm">取消后预订状态将变更为已取消</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setViewMode('detail')}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
        <div className="text-sm text-red-300">
          确定要取消 <span className="font-bold">{customer.name}</span> 在{' '}
          <span className="font-bold">{room.name}</span> 的预订吗？
        </div>
        <div className="text-xs text-red-400/70 mt-1">
          {formatDateTime(new Date(booking.startTime))} - {formatDateTime(new Date(booking.endTime))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block">取消原因</label>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 resize-none"
          placeholder="请输入取消原因..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setViewMode('detail')} className="flex-1">
          返回
        </Button>
        <Button variant="danger" onClick={handleCancel} className="flex-1">
          <XCircle className="w-4 h-4" />
          确认取消
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={!!booking} onClose={onClose} size="lg">
      <div className="p-6">
        {viewMode === 'detail' && renderDetailView()}
        {viewMode === 'checkout' && renderCheckoutView()}
        {viewMode === 'cancel' && renderCancelView()}
      </div>
    </Modal>
  );
}
