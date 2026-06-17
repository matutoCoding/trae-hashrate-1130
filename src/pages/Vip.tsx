import { useState } from 'react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatCard } from '@/components/common/StatCard';
import {
  Crown,
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Star,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowUp,
  Gift,
} from 'lucide-react';
import {
  getMemberLevelLabel,
  getMemberLevelColor,
} from '@/utils/priceUtils';
import { formatMoney, formatPhone } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { MemberLevel, RoomType } from '@/types';

export default function Vip() {
  const {
    customers,
    getVipCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    upgradeMemberLevel,
    getPriorityConfig,
    priorityConfigs,
  } = useCustomerStore();
  
  const { vipCutInLine } = useQueueStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCutInModalOpen, setIsCutInModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [selectedVipId, setSelectedVipId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    memberLevel: 'gold' as MemberLevel,
    isVip: true,
    roomType: 'medium' as RoomType,
    peopleCount: 4,
  });
  
  const vipCustomers = getVipCustomers();
  
  const handleOpenModal = (customerId?: string) => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setEditingCustomer(customerId);
        setFormData({
          ...formData,
          name: customer.name,
          phone: customer.phone,
          memberLevel: customer.memberLevel,
          isVip: customer.isVip,
        });
      }
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        memberLevel: 'gold',
        isVip: true,
        roomType: 'medium',
        peopleCount: 4,
      });
    }
    setIsAddModalOpen(true);
  };
  
  const handleSubmit = () => {
    if (editingCustomer) {
      updateCustomer(editingCustomer, {
        name: formData.name,
        phone: formData.phone,
        memberLevel: formData.memberLevel,
        isVip: ['gold', 'platinum', 'diamond'].includes(formData.memberLevel),
      });
    } else {
      addCustomer({
        name: formData.name,
        phone: formData.phone,
        memberLevel: formData.memberLevel,
        isVip: formData.isVip,
      });
    }
    setIsAddModalOpen(false);
  };
  
  const handleOpenCutInModal = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedVipId(customerId);
      setFormData({
        ...formData,
        name: customer.name,
        phone: customer.phone,
        memberLevel: customer.memberLevel,
        isVip: customer.isVip,
      });
      setIsCutInModalOpen(true);
    }
  };
  
  const handleCutInLine = () => {
    if (selectedVipId) {
      const customer = customers.find((c) => c.id === selectedVipId);
      if (customer) {
        vipCutInLine({
          customerId: customer.id,
          customerName: customer.name,
          peopleCount: formData.peopleCount,
          roomTypePreference: formData.roomType,
          vipLevel: customer.memberLevel,
          phone: customer.phone,
        });
      }
    }
    setIsCutInModalOpen(false);
    setSelectedVipId(null);
  };
  
  const levelColors: Record<MemberLevel, string> = {
    normal: 'from-gray-600 to-gray-700',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-amber-400 to-amber-600',
    platinum: 'from-cyan-400 to-cyan-600',
    diamond: 'from-purple-400 to-purple-600',
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="VIP会员总数"
          value={vipCustomers.length}
          subtitle="位"
          icon={<Crown className="w-5 h-5" />}
          color="purple"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="钻石会员"
          value={vipCustomers.filter((c) => c.memberLevel === 'diamond').length}
          subtitle="位"
          icon={<Star className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="本月新增"
          value="12"
          subtitle="位"
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="VIP消费占比"
          value="68%"
          subtitle="营收"
          icon={<Gift className="w-5 h-5" />}
          color="blue"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">VIP会员列表</h3>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4" />
                添加会员
              </Button>
            </div>
            
            <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
              {vipCustomers.map((customer) => {
                const config = getPriorityConfig(customer.memberLevel);
                
                return (
                  <div
                    key={customer.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg',
                          levelColors[customer.memberLevel]
                        )}
                      >
                        {customer.name.charAt(0)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{customer.name}</h4>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              getMemberLevelColor(customer.memberLevel)
                            )}
                          >
                            {getMemberLevelLabel(customer.memberLevel)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhone(customer.phone)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {customer.points.toLocaleString()} 积分
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>累计消费 {formatMoney(customer.totalSpent)}</span>
                          <span>到店 {customer.visitCount} 次</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenCutInModal(customer.id)}
                      >
                        <ArrowUp className="w-4 h-4" />
                        插队
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(customer.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCustomer(customer.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">会员等级权益</h3>
            </div>
            
            <div className="divide-y divide-gray-800">
              {priorityConfigs.map((config) => (
                <div key={config.level} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center',
                        levelColors[config.level]
                      )}
                    >
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {getMemberLevelLabel(config.level)}
                      </h4>
                      <p className="text-xs text-gray-500">
                        优先级 {config.queuePriority}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {config.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-gray-400"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  {config.canSkipQueue && (
                    <div className="mt-2 text-xs text-purple-400">
                      每日可插队 {config.skipLimitPerDay} 次
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/50 to-amber-900/30 rounded-xl border border-purple-500/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <h4 className="font-medium text-white">升级会员</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              升级到更高等级，享受更多专属权益和优先服务
            </p>
            <Button fullWidth variant="outline">
              查看升级条件
            </Button>
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingCustomer ? '编辑会员' : '添加VIP会员'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="客户姓名"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">手机号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="手机号码"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">会员等级</label>
            <div className="grid grid-cols-5 gap-2">
              {(['silver', 'gold', 'platinum', 'diamond'] as MemberLevel[]).map(
                (level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, memberLevel: level })
                    }
                    className={cn(
                      'p-2 rounded-lg text-xs font-medium transition-all',
                      formData.memberLevel === level
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    {getMemberLevelLabel(level)}
                  </button>
                )
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-2">权益预览</p>
            {getPriorityConfig(formData.memberLevel)?.benefits.map(
              (benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-gray-300 mb-1"
                >
                  <Star className="w-3 h-3 text-amber-400" />
                  {benefit}
                </div>
              )
            )}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setIsAddModalOpen(false)}
            >
              取消
            </Button>
            <Button fullWidth onClick={handleSubmit}>
              {editingCustomer ? '保存修改' : '添加会员'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={isCutInModalOpen}
        onClose={() => setIsCutInModalOpen(false)}
        title="VIP优先插队"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold',
                  selectedVipId &&
                    customers.find((c) => c.id === selectedVipId)?.memberLevel &&
                    levelColors[
                      customers.find((c) => c.id === selectedVipId)
                        ?.memberLevel as MemberLevel
                    ]
                )}
              >
                {formData.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-medium text-white">{formData.name}</h4>
                <p className="text-sm text-purple-400">
                  {getMemberLevelLabel(formData.memberLevel)} · VIP插队通道
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">人数</label>
              <input
                type="number"
                min="1"
                value={formData.peopleCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    peopleCount: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                包厢类型
              </label>
              <select
                value={formData.roomType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roomType: e.target.value as RoomType,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="small">小包</option>
                <option value="medium">中包</option>
                <option value="large">大包</option>
                <option value="vip">VIP房</option>
                <option value="party">派对房</option>
              </select>
            </div>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>VIP客户将优先安排到队列前方位置</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setIsCutInModalOpen(false)}
            >
              取消
            </Button>
            <Button fullWidth onClick={handleCutInLine}>
              <ArrowUp className="w-4 h-4" />
              确认插队
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
