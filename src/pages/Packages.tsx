import { useState } from 'react';
import { useBookingStore } from '@/stores/useBookingStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatCard } from '@/components/common/StatCard';
import {
  Wine,
  Plus,
  Edit,
  Trash2,
  Beer,
  GlassWater,
  Coffee,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { formatMoney } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { PackageCategory } from '@/types';

export default function Packages() {
  const { packages, addPackage, updatePackage, deletePackage } = useBookingStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PackageCategory | 'all'>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: 'combo' as PackageCategory,
    items: [] as { name: string; quantity: number; unit: string }[],
  });
  
  const categories: { key: PackageCategory | 'all'; label: string; icon: any }[] = [
    { key: 'all', label: '全部', icon: Sparkles },
    { key: 'beer', label: '啤酒', icon: Beer },
    { key: 'wine', label: '红酒', icon: Wine },
    { key: 'spirit', label: '洋酒', icon: GlassWater },
    { key: 'snack', label: '小食', icon: Coffee },
    { key: 'combo', label: '套餐', icon: Utensils },
  ];
  
  const filteredPackages =
    activeCategory === 'all'
      ? packages
      : packages.filter((p) => p.category === activeCategory);
  
  const totalPackages = packages.length;
  const avgPrice = Math.round(
    packages.reduce((sum, p) => sum + p.price, 0) / (packages.length || 1)
  );
  
  const handleOpenModal = (pkgId?: string) => {
    if (pkgId) {
      const pkg = packages.find((p) => p.id === pkgId);
      if (pkg) {
        setEditingPkg(pkgId);
        setFormData({
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          originalPrice: pkg.originalPrice,
          category: pkg.category,
          items: pkg.items,
        });
      }
    } else {
      setEditingPkg(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        category: 'combo',
        items: [],
      });
    }
    setIsModalOpen(true);
  };
  
  const handleSubmit = () => {
    // In a real app, we'd dispatch to store
    setIsModalOpen(false);
  };
  
  const categoryColors: Record<PackageCategory, string> = {
    beer: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    wine: 'from-red-500/20 to-red-600/5 border-red-500/30',
    spirit: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    snack: 'from-green-500/20 to-green-600/5 border-green-500/30',
    combo: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="套餐总数"
          value={totalPackages}
          subtitle="个"
          icon={<Wine className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="平均价格"
          value={formatMoney(avgPrice)}
          subtitle=""
          icon={<Sparkles className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="热销套餐"
          value="黄金场"
          subtitle="TOP1"
          icon={<Utensils className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="今日销量"
          value="36"
          subtitle="份"
          icon={<Beer className="w-5 h-5" />}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
      </div>
      
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeCategory === cat.key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            添加套餐
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 p-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all hover:scale-[1.02]',
                categoryColors[pkg.category]
              )}
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Wine className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{pkg.name}</h4>
                      <p className="text-xs text-gray-400">{pkg.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 mb-3">
                  {pkg.items.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-400">{item.name}</span>
                      <span className="text-gray-300">
                        ×{item.quantity}
                        {item.unit}
                      </span>
                    </div>
                  ))}
                  {pkg.items.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      还有 {pkg.items.length - 3} 项...
                    </p>
                  )}
                </div>
                
                <div className="flex items-end justify-between pt-3 border-t border-gray-700/50">
                  <div>
                    <span className="text-2xl font-bold text-amber-400">
                      {formatMoney(pkg.price)}
                    </span>
                    <span className="text-xs text-gray-500 line-through ml-2">
                      {formatMoney(pkg.originalPrice)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenModal(pkg.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePackage(pkg.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPkg ? '编辑套餐' : '添加套餐'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">套餐名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="套餐名称"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">分类</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as PackageCategory,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="beer">啤酒</option>
                <option value="wine">红酒</option>
                <option value="spirit">洋酒</option>
                <option value="snack">小食</option>
                <option value="combo">套餐</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">描述</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="简短描述"
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">售价</label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">原价</label>
              <input
                type="number"
                min="0"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button fullWidth onClick={handleSubmit}>
              {editingPkg ? '保存修改' : '添加套餐'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
