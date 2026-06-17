import { useState, useMemo } from 'react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useBookingStore } from '@/stores/useBookingStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatCard } from '@/components/common/StatCard';
import {
  Repeat,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar,
  Clock,
  Users,
  Music,
  Eye,
  ChevronRight,
} from 'lucide-react';
import {
  getFrequencyLabel,
  getWeekdayNames,
  generateBookingsFromRule,
  generateRecurringDates,
} from '@/utils/recurringUtils';
import { formatDate, formatMoney } from '@/utils/dateUtils';
import { getMemberLevelColor, getMemberLevelLabel } from '@/utils/priceUtils';
import { RecurringFrequency } from '@/types';
import { cn } from '@/lib/utils';

export default function Recurring() {
  const { recurringRules, customers, addRecurringRule, updateRecurringRule, deleteRecurringRule, toggleRecurringRule } = useCustomerStore();
  const { rooms, addBookings, packages } = useBookingStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    roomId: '',
    frequency: 'weekly' as RecurringFrequency,
    weekdays: [5] as number[],
    startTime: '20:00',
    endTime: '23:00',
    startDate: formatDate(new Date()),
    occurrences: 12,
    packageId: '',
    isActive: true,
  });
  
  const activeRules = recurringRules.filter((r) => r.isActive);
  const totalOccurrences = recurringRules.reduce((sum, r) => sum + (r.occurrences || 0), 0);
  
  const handleOpenModal = (ruleId?: string) => {
    if (ruleId) {
      const rule = recurringRules.find((r) => r.id === ruleId);
      if (rule) {
        setEditingRule(ruleId);
        setFormData({
          customerId: rule.customerId,
          roomId: rule.roomId,
          frequency: rule.frequency,
          weekdays: rule.weekdays,
          startTime: rule.startTime,
          endTime: rule.endTime,
          startDate: formatDate(new Date(rule.startDate)),
          occurrences: rule.occurrences || 12,
          packageId: rule.packageId || '',
          isActive: rule.isActive,
        });
      }
    } else {
      setEditingRule(null);
      setFormData({
        customerId: customers[0]?.id || '',
        roomId: rooms[0]?.id || '',
        frequency: 'weekly',
        weekdays: [5],
        startTime: '20:00',
        endTime: '23:00',
        startDate: formatDate(new Date()),
        occurrences: 12,
        packageId: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };
  
  const handleSubmit = () => {
    const customer = customers.find((c) => c.id === formData.customerId);
    const room = rooms.find((r) => r.id === formData.roomId);
    
    const ruleData = {
      ...formData,
      startDate: new Date(formData.startDate),
      customerName: customer?.name,
      roomName: room?.name,
    };
    
    if (editingRule) {
      updateRecurringRule(editingRule, ruleData);
    } else {
      addRecurringRule(ruleData);
    }
    
    setIsModalOpen(false);
  };
  
  const toggleWeekday = (day: number) => {
    setFormData((prev) => {
      if (prev.weekdays.includes(day)) {
        return { ...prev, weekdays: prev.weekdays.filter((d) => d !== day) };
      }
      return { ...prev, weekdays: [...prev.weekdays, day].sort() };
    });
  };
  
  const handleGenerate = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setShowPreview(false);
    setShowGenerateModal(true);
  };
  
  const selectedRule = selectedRuleId
    ? recurringRules.find((r) => r.id === selectedRuleId)
    : null;
  
  const previewData = useMemo(() => {
    if (!selectedRule) return { dates: [], totalPrice: 0, roomPricePerHour: 0, packagePrice: 0 };
    
    const room = rooms.find((r) => r.id === selectedRule.roomId);
    const pkg = packages.find((p) => p.id === selectedRule.packageId);
    
    const dates = generateRecurringDates(selectedRule);
    
    const startHours = parseInt(selectedRule.startTime.split(':')[0]);
    const startMinutes = parseInt(selectedRule.startTime.split(':')[1]);
    const endHours = parseInt(selectedRule.endTime.split(':')[0]);
    const endMinutes = parseInt(selectedRule.endTime.split(':')[1]);
    
    let startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;
    if (endTotal <= startTotal) {
      endTotal += 24 * 60;
    }
    const durationHours = (endTotal - startTotal) / 60;
    const roomPricePerHour = room?.pricePerHour || 0;
    const packagePrice = pkg?.price || 0;
    const singlePrice = Math.round(durationHours * roomPricePerHour + packagePrice);
    const totalPrice = singlePrice * dates.length;
    
    return {
      dates,
      totalPrice,
      roomPricePerHour,
      packagePrice,
      singlePrice,
      durationHours,
    };
  }, [selectedRule, rooms, packages]);
  
  const confirmGenerate = () => {
    if (!selectedRuleId) return;
    
    const rule = recurringRules.find((r) => r.id === selectedRuleId);
    const room = rooms.find((r) => r.id === rule?.roomId);
    const pkg = packages.find((p) => p.id === rule?.packageId);
    
    if (rule && room) {
      const newBookings = generateBookingsFromRule(
        rule,
        rule.endTime,
        room.pricePerHour,
        pkg?.price || 0
      );
      addBookings(newBookings);
    }
    
    setShowGenerateModal(false);
    setSelectedRuleId(null);
    setShowPreview(false);
  };
  
  const generatedCount = previewData.dates.length;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="周期规则"
          value={recurringRules.length}
          subtitle="条"
          icon={<Repeat className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="活跃规则"
          value={activeRules.length}
          subtitle="条"
          icon={<Play className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="总预订数"
          value={totalOccurrences}
          subtitle="次"
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="覆盖客户"
          value={new Set(recurringRules.map((r) => r.customerId)).size}
          subtitle="位"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
      </div>
      
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">周期规则列表</h3>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            新建规则
          </Button>
        </div>
        
        <div className="divide-y divide-gray-800">
          {recurringRules.map((rule) => {
            const customer = customers.find((c) => c.id === rule.customerId);
            const room = rooms.find((r) => r.id === rule.roomId);
            
            return (
              <div
                key={rule.id}
                className={cn(
                  'p-4 flex items-center justify-between transition-colors',
                  !rule.isActive && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      rule.isActive
                        ? 'bg-purple-500/20'
                        : 'bg-gray-700'
                    )}
                  >
                    <Repeat
                      className={cn(
                        'w-6 h-6',
                        rule.isActive ? 'text-purple-400' : 'text-gray-500'
                      )}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">
                        {rule.customerName || customer?.name}
                      </h4>
                      {customer && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getMemberLevelColor(customer.memberLevel)}`}
                        >
                          {getMemberLevelLabel(customer.memberLevel)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {rule.roomName || room?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rule.startTime} - {rule.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{getFrequencyLabel(rule.frequency)}</span>
                      <span>{getWeekdayNames(rule.weekdays)}</span>
                      <span>共 {rule.occurrences} 次</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerate(rule.id)}
                  >
                    生成预订
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleRecurringRule(rule.id)}
                  >
                    {rule.isActive ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenModal(rule.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRecurringRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? '编辑周期规则' : '新建周期规则'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">常客</label>
              <select
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">包厢</label>
              <select
                value={formData.roomId}
                onChange={(e) =>
                  setFormData({ ...formData, roomId: e.target.value })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {rooms
                  .filter((r) => r.status === 'active')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - ¥{r.pricePerHour}/小时
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">周期类型</label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: e.target.value as RecurringFrequency,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="weekly">每周</option>
                <option value="biweekly">每两周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">周期数</label>
              <input
                type="number"
                min="1"
                max="52"
                value={formData.occurrences}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    occurrences: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">星期</label>
            <div className="flex gap-2">
              {[
                { day: 0, label: '日' },
                { day: 1, label: '一' },
                { day: 2, label: '二' },
                { day: 3, label: '三' },
                { day: 4, label: '四' },
                { day: 5, label: '五' },
                { day: 6, label: '六' },
              ].map(({ day, label }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                    formData.weekdays.includes(day)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">开始时间</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">结束时间</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">开始日期</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button fullWidth onClick={handleSubmit}>
              {editingRule ? '保存修改' : '创建规则'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setShowPreview(false);
        }}
        title="确认生成预订"
        size="lg"
      >
        <div className="space-y-4">
          {selectedRule && (
            <>
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">客户</span>
                  <span className="text-white">{selectedRule.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">包厢</span>
                  <span className="text-white">{selectedRule.roomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">周期</span>
                  <span className="text-white">
                    {getFrequencyLabel(selectedRule.frequency)} ·{' '}
                    {getWeekdayNames(selectedRule.weekdays)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">时段</span>
                  <span className="text-white">
                    {selectedRule.startTime} - {selectedRule.endTime}
                    {previewData.durationHours && (
                      <span className="text-gray-400 ml-2">
                        ({previewData.durationHours.toFixed(1)}小时)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">单价</span>
                  <span className="text-white">
                    {formatMoney(previewData.singlePrice || 0)}/次
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">生成数量</span>
                    <span className="text-purple-400 font-medium">
                      {generatedCount} 条预订
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">预计总金额</span>
                    <span className="text-green-400 font-bold text-lg">
                      {formatMoney(previewData.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  预览日期列表
                </span>
                <ChevronRight className={cn(
                  'w-4 h-4 transition-transform',
                  showPreview && 'rotate-90'
                )} />
              </button>
              
              {showPreview && (
                <div className="max-h-60 overflow-y-auto bg-gray-800/30 rounded-lg p-3 space-y-2">
                  {previewData.dates.length > 0 ? (
                    previewData.dates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded text-sm"
                      >
                        <span className="text-gray-400">第 {index + 1} 次</span>
                        <span className="text-white">
                          {formatDate(date, 'yyyy-MM-dd EEEE')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      没有可生成的日期，请检查周期规则配置
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setShowGenerateModal(false);
                    setShowPreview(false);
                  }}
                >
                  取消
                </Button>
                <Button
                  fullWidth
                  onClick={confirmGenerate}
                  disabled={previewData.dates.length === 0}
                >
                  确认生成 {generatedCount} 条
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
