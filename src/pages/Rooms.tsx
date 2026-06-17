import { useState } from 'react';
import { useBookingStore } from '@/stores/useBookingStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatCard } from '@/components/common/StatCard';
import {
  Music,
  Plus,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Settings,
  Wrench,
} from 'lucide-react';
import { getRoomTypeLabel } from '@/utils/priceUtils';
import { formatMoney } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { RoomType } from '@/types';

export default function Rooms() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useBookingStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'medium' as RoomType,
    capacity: 6,
    pricePerHour: 158,
    equipment: [] as string[],
    floor: 1,
    status: 'active' as 'active' | 'maintenance' | 'disabled',
  });
  
  const equipmentOptions = [
    '点歌系统',
    '无线麦',
    '沙发',
    '茶几',
    '氛围灯',
    '舞台灯',
    '专业音响',
    'LED大屏',
    '独立卫生间',
    'DJ台',
    '舞池',
    '专属服务员',
  ];
  
  const activeRooms = rooms.filter((r) => r.status === 'active');
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance');
  
  const handleOpenModal = (roomId?: string) => {
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setEditingRoom(roomId);
        setFormData({
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          pricePerHour: room.pricePerHour,
          equipment: room.equipment,
          floor: room.floor,
          status: room.status,
        });
      }
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        type: 'medium',
        capacity: 6,
        pricePerHour: 158,
        equipment: [],
        floor: 1,
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };
  
  const handleSubmit = () => {
    if (editingRoom) {
      updateRoom(editingRoom, formData);
    } else {
      addRoom(formData);
    }
    setIsModalOpen(false);
  };
  
  const toggleEquipment = (equip: string) => {
    setFormData((prev) => {
      if (prev.equipment.includes(equip)) {
        return { ...prev, equipment: prev.equipment.filter((e) => e !== equip) };
      }
      return { ...prev, equipment: [...prev.equipment, equip] };
    });
  };
  
  const typeColors: Record<RoomType, string> = {
    small: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    large: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    vip: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    party: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="包厢总数"
          value={rooms.length}
          subtitle="间"
          icon={<Music className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="运营中"
          value={activeRooms.length}
          subtitle="间"
          icon={<Settings className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="维护中"
          value={maintenanceRooms.length}
          subtitle="间"
          icon={<Wrench className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="总容纳"
          value={activeRooms.reduce((sum, r) => sum + r.capacity, 0)}
          subtitle="人"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
      </div>
      
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">包厢列表</h3>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            添加包厢
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 p-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={cn(
                'bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden transition-all hover:border-gray-600',
                room.status === 'maintenance' && 'opacity-60'
              )}
            >
              <div
                className={cn(
                  'h-24 flex items-center justify-center relative',
                  room.type === 'vip'
                    ? 'bg-gradient-to-br from-amber-600/30 to-amber-900/30'
                    : room.type === 'party'
                    ? 'bg-gradient-to-br from-pink-600/30 to-purple-900/30'
                    : room.type === 'large'
                    ? 'bg-gradient-to-br from-purple-600/30 to-blue-900/30'
                    : room.type === 'medium'
                    ? 'bg-gradient-to-br from-blue-600/30 to-cyan-900/30'
                    : 'bg-gradient-to-br from-green-600/30 to-teal-900/30'
                )}
              >
                <Music className="w-12 h-12 text-white/80" />
                {room.status === 'maintenance' && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 rounded bg-amber-500/90 text-white">
                      维护中
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{room.name}</h4>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded border',
                      typeColors[room.type]
                    )}
                  >
                    {getRoomTypeLabel(room.type)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room.capacity}人
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ¥{room.pricePerHour}/时
                  </span>
                  <span>{room.floor}楼</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {room.equipment.slice(0, 4).map((equip, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 rounded text-gray-400"
                    >
                      {equip}
                    </span>
                  ))}
                  {room.equipment.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 rounded text-gray-400">
                      +{room.equipment.length - 4}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    fullWidth
                    onClick={() => handleOpenModal(room.id)}
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    fullWidth
                    onClick={() => deleteRoom(room.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? '编辑包厢' : '添加包厢'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">包厢名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：小包101"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">包厢类型</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as RoomType })
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
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">容纳人数</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">小时单价</label>
              <input
                type="number"
                min="0"
                value={formData.pricePerHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerHour: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">楼层</label>
              <input
                type="number"
                min="1"
                value={formData.floor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    floor: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">设备配置</label>
            <div className="flex flex-wrap gap-2">
              {equipmentOptions.map((equip) => (
                <button
                  key={equip}
                  type="button"
                  onClick={() => toggleEquipment(equip)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    formData.equipment.includes(equip)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {equip}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'maintenance' | 'disabled',
                })
              }
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="active">运营中</option>
              <option value="maintenance">维护中</option>
              <option value="disabled">停用</option>
            </select>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">预估日收益（8小时）</span>
              <span className="text-lg font-bold text-green-400">
                {formatMoney(formData.pricePerHour * 8)}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button fullWidth onClick={handleSubmit}>
              {editingRoom ? '保存修改' : '添加包厢'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
