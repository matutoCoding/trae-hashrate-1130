import { useState } from 'react';
import { useQueueStore } from '@/stores/useQueueStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatCard } from '@/components/common/StatCard';
import {
  Users,
  Clock,
  Mic2,
  UserPlus,
  Phone,
  UserCheck,
  X,
  SkipForward,
  RotateCcw,
  Crown,
} from 'lucide-react';
import {
  getQueueStatusLabel,
  getMemberLevelLabel,
  getMemberLevelColor,
  getRoomTypeLabel,
} from '@/utils/priceUtils';
import { getEstimatedWaitText } from '@/utils/queueUtils';
import { formatTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { RoomType, MemberLevel } from '@/types';

export default function Queue() {
  const {
    queue,
    currentCallNumber,
    getWaitingQueue,
    getCalledQueue,
    callNext,
    callNumber,
    seatCustomer,
    cancelQueueItem,
    noShow,
    moveToBack,
    addToQueue,
    vipCutInLine,
  } = useQueueStore();
  
  const { customers, searchCustomers } = useCustomerStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [newQueue, setNewQueue] = useState({
    customerName: '',
    phone: '',
    peopleCount: 4,
    roomTypePreference: 'medium' as RoomType,
    customerId: '',
    vipLevel: 'normal' as MemberLevel,
  });
  
  const waitingQueue = getWaitingQueue();
  const calledQueue = getCalledQueue();
  
  const handleAddToQueue = () => {
    addToQueue({
      customerId: newQueue.customerId || 'walk-in',
      customerName: newQueue.customerName,
      peopleCount: newQueue.peopleCount,
      roomTypePreference: newQueue.roomTypePreference,
      isVip: false,
      phone: newQueue.phone,
    });
    setIsAddModalOpen(false);
    resetForm();
  };
  
  const handleVipCutIn = () => {
    if (newQueue.customerId) {
      const customer = customers.find((c) => c.id === newQueue.customerId);
      if (customer) {
        vipCutInLine({
          customerId: customer.id,
          customerName: customer.name,
          peopleCount: newQueue.peopleCount,
          roomTypePreference: newQueue.roomTypePreference,
          vipLevel: customer.memberLevel,
          phone: customer.phone,
        });
      }
    } else {
      vipCutInLine({
        customerId: 'vip-walk-in',
        customerName: newQueue.customerName,
        peopleCount: newQueue.peopleCount,
        roomTypePreference: newQueue.roomTypePreference,
        vipLevel: 'gold',
        phone: newQueue.phone,
      });
    }
    setIsVipModalOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setNewQueue({
      customerName: '',
      phone: '',
      peopleCount: 4,
      roomTypePreference: 'medium',
      customerId: '',
      vipLevel: 'normal',
    });
    setSearchKeyword('');
  };
  
  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setNewQueue({
        ...newQueue,
        customerId,
        customerName: customer.name,
        phone: customer.phone,
        vipLevel: customer.memberLevel,
      });
    }
  };
  
  const filteredCustomers = searchKeyword
    ? searchCustomers(searchKeyword)
    : [];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="等待中"
          value={waitingQueue.length}
          subtitle="桌"
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="已叫号"
          value={calledQueue.length}
          subtitle="桌"
          icon={<Mic2 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="当前叫号"
          value={currentCallNumber}
          subtitle="号"
          icon={<Clock className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="VIP等待"
          value={waitingQueue.filter((q) => q.isVip).length}
          subtitle="位"
          icon={<Crown className="w-5 h-5" />}
          color="purple"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">当前叫号</p>
              <div className="text-6xl font-bold text-green-400 mb-2 animate-pulse">
                {currentCallNumber}
              </div>
              <p className="text-sm text-gray-500">请听到叫号后到前台</p>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button size="lg" onClick={callNext}>
                <Mic2 className="w-5 h-5" />
                叫下一位
              </Button>
              <Button size="lg" variant="secondary">
                <RotateCcw className="w-5 h-5" />
                重叫
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">排队队列</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  取号
                </Button>
                <Button size="sm" onClick={() => setIsVipModalOpen(true)}>
                  <Crown className="w-4 h-4" />
                  VIP插队
                </Button>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {waitingQueue.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>暂无排队</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {waitingQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 flex items-center justify-between transition-all',
                        index === 0 && 'bg-purple-500/5'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-lg flex flex-col items-center justify-center',
                            item.isVip
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                              : 'bg-gray-700'
                          )}
                        >
                          <span className="text-lg font-bold text-white">
                            {item.queueNumber}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {item.customerName}
                            </span>
                            {item.isVip && item.vipLevel && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${getMemberLevelColor(item.vipLevel)}`}
                              >
                                {getMemberLevelLabel(item.vipLevel)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>{item.peopleCount}人</span>
                            <span>·</span>
                            <span>{getRoomTypeLabel(item.roomTypePreference)}</span>
                            <span>·</span>
                            <span>{formatTime(item.joinTime)}取号</span>
                          </div>
                          {item.estimatedWaitTime !== undefined && (
                            <div className="text-xs text-amber-400 mt-1">
                              预计等待 {getEstimatedWaitText(item.estimatedWaitTime)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => callNumber(item.id)}
                        >
                          叫号
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => seatCustomer(item.id)}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelQueueItem(item.id)}
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">已叫号</h3>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {calledQueue.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  暂无已叫号
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {calledQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-blue-400">
                          {item.queueNumber}
                        </span>
                        <div>
                          <p className="text-sm text-white">{item.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {item.calledTime && formatTime(item.calledTime)} 叫号
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => seatCustomer(item.id)}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => noShow(item.id)}
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveToBack(item.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h4 className="text-sm font-medium text-white mb-3">快捷操作</h4>
            <div className="space-y-2">
              <Button fullWidth variant="outline" size="sm">
                清空已完成
              </Button>
              <Button fullWidth variant="outline" size="sm">
                导出排队记录
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="取号排队"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              搜索客户 (可选)
            </label>
            <input
              type="text"
              placeholder="输入姓名或手机号"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {filteredCustomers.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    className="p-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-sm text-white">{c.name}</span>
                    <span className="text-xs text-gray-500">{c.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">姓名</label>
              <input
                type="text"
                value={newQueue.customerName}
                onChange={(e) =>
                  setNewQueue({ ...newQueue, customerName: e.target.value })
                }
                placeholder="客户姓名"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <Phone className="inline w-4 h-4 mr-1" />
                手机号
              </label>
              <input
                type="tel"
                value={newQueue.phone}
                onChange={(e) =>
                  setNewQueue({ ...newQueue, phone: e.target.value })
                }
                placeholder="手机号码"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">人数</label>
              <input
                type="number"
                min="1"
                value={newQueue.peopleCount}
                onChange={(e) =>
                  setNewQueue({
                    ...newQueue,
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
                value={newQueue.roomTypePreference}
                onChange={(e) =>
                  setNewQueue({
                    ...newQueue,
                    roomTypePreference: e.target.value as RoomType,
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
          
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setIsAddModalOpen(false)}>
              取消
            </Button>
            <Button fullWidth onClick={handleAddToQueue}>
              确认取号
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        title="VIP插队"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-purple-300">
                VIP客户可享受优先插队服务
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              搜索VIP客户
            </label>
            <input
              type="text"
              placeholder="输入姓名或手机号"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {filteredCustomers.filter((c) => c.isVip).length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                {filteredCustomers
                  .filter((c) => c.isVip)
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className="p-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{c.name}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${getMemberLevelColor(c.memberLevel)}`}
                        >
                          {getMemberLevelLabel(c.memberLevel)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{c.phone}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">姓名</label>
              <input
                type="text"
                value={newQueue.customerName}
                onChange={(e) =>
                  setNewQueue({ ...newQueue, customerName: e.target.value })
                }
                placeholder="VIP客户姓名"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                手机号
              </label>
              <input
                type="tel"
                value={newQueue.phone}
                onChange={(e) =>
                  setNewQueue({ ...newQueue, phone: e.target.value })
                }
                placeholder="手机号码"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">人数</label>
              <input
                type="number"
                min="1"
                value={newQueue.peopleCount}
                onChange={(e) =>
                  setNewQueue({
                    ...newQueue,
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
                value={newQueue.roomTypePreference}
                onChange={(e) =>
                  setNewQueue({
                    ...newQueue,
                    roomTypePreference: e.target.value as RoomType,
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
          
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setIsVipModalOpen(false)}>
              取消
            </Button>
            <Button fullWidth onClick={handleVipCutIn}>
              <Crown className="w-4 h-4" />
              VIP插队
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
