import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { StatCard } from '@/components/common/StatCard';
import {
  DollarSign,
  Users,
  Music,
  TrendingUp,
  CalendarCheck,
  Crown,
  Clock,
  BarChart3,
} from 'lucide-react';
import { formatMoney } from '@/utils/dateUtils';
import { getMemberLevelLabel } from '@/utils/priceUtils';

export default function Stats() {
  const { bookings, rooms, packages } = useBookingStore();
  const { customers, getVipCustomers } = useCustomerStore();
  
  const vipCustomers = getVipCustomers();
  
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + b.totalPrice + b.extraPrice,
    0
  );
  
  const confirmedBookings = bookings.filter(
    (b) => b.status !== 'cancelled'
  );
  
  const completedBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'extended'
  );
  
  const activeRooms = rooms.filter((r) => r.status === 'active');
  const avgUtilization = Math.round(
    (confirmedBookings.length / (activeRooms.length * 14)) * 100
  );
  
  const vipRevenue = bookings
    .filter((b) => {
      const customer = customers.find((c) => c.id === b.customerId);
      return customer?.isVip;
    })
    .reduce((sum, b) => sum + b.totalPrice + b.extraPrice, 0);
  
  const vipPercentage = totalRevenue > 0
    ? Math.round((vipRevenue / totalRevenue) * 100)
    : 0;
  
  const memberStats = [
    { level: 'diamond', count: vipCustomers.filter((c) => c.memberLevel === 'diamond').length },
    { level: 'platinum', count: vipCustomers.filter((c) => c.memberLevel === 'platinum').length },
    { level: 'gold', count: vipCustomers.filter((c) => c.memberLevel === 'gold').length },
    { level: 'silver', count: customers.filter((c) => c.memberLevel === 'silver').length },
    { level: 'normal', count: customers.filter((c) => c.memberLevel === 'normal').length },
  ];
  
  const roomTypeStats = [
    { type: 'small', count: rooms.filter((r) => r.type === 'small').length, label: '小包' },
    { type: 'medium', count: rooms.filter((r) => r.type === 'medium').length, label: '中包' },
    { type: 'large', count: rooms.filter((r) => r.type === 'large').length, label: '大包' },
    { type: 'vip', count: rooms.filter((r) => r.type === 'vip').length, label: 'VIP房' },
    { type: 'party', count: rooms.filter((r) => r.type === 'party').length, label: '派对房' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="总营收"
          value={formatMoney(totalRevenue)}
          subtitle="累计"
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
          trend={{ value: 18, isPositive: true }}
        />
        <StatCard
          title="总预订数"
          value={confirmedBookings.length}
          subtitle="单"
          icon={<CalendarCheck className="w-5 h-5" />}
          color="purple"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="包厢利用率"
          value={`${avgUtilization}%`}
          subtitle="平均"
          icon={<Music className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="VIP消费占比"
          value={`${vipPercentage}%`}
          subtitle="营收"
          icon={<Crown className="w-5 h-5" />}
          color="amber"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <BarChart3 className="inline w-5 h-5 mr-2 text-purple-400" />
              营收趋势
            </h3>
            
            <div className="h-64 flex items-end justify-between gap-2">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(
                (day, idx) => {
                  const heights = [45, 52, 38, 60, 78, 92, 85];
                  const revenue = [8500, 9800, 7200, 11400, 14800, 17500, 16200];
                  
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-500 hover:to-purple-300"
                        style={{ height: `${heights[idx]}%` }}
                      />
                      <span className="text-xs text-gray-500">{day}</span>
                      <span className="text-xs text-gray-400">¥{(revenue[idx] / 1000).toFixed(1)}k</span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <Users className="inline w-5 h-5 mr-2 text-blue-400" />
              会员分布
            </h3>
            
            <div className="space-y-4">
              {memberStats.map((stat) => {
                const total = customers.length;
                const percentage = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                
                const colors: Record<string, string> = {
                  diamond: 'from-purple-500 to-purple-600',
                  platinum: 'from-cyan-500 to-cyan-600',
                  gold: 'from-amber-500 to-amber-600',
                  silver: 'from-slate-400 to-slate-500',
                  normal: 'from-gray-500 to-gray-600',
                };
                
                return (
                  <div key={stat.level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">
                        {getMemberLevelLabel(stat.level)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {stat.count} 人 ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[stat.level]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <Music className="inline w-5 h-5 mr-2 text-green-400" />
              包厢分布
            </h3>
            
            <div className="space-y-3">
              {roomTypeStats.map((stat) => {
                const total = rooms.length;
                const percentage = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                
                return (
                  <div
                    key={stat.type}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <span className="text-sm text-gray-300">{stat.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">
                        {stat.count} 间
                      </span>
                      <span className="text-xs text-gray-500">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <TrendingUp className="inline w-5 h-5 mr-2 text-amber-400" />
              热销套餐 TOP3
            </h3>
            
            <div className="space-y-3">
              {packages.slice(0, 3).map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      idx === 0
                        ? 'bg-amber-500 text-white'
                        : idx === 1
                        ? 'bg-gray-400 text-white'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{pkg.name}</p>
                    <p className="text-xs text-gray-500">
                      已售 {Math.floor(Math.random() * 100) + 50} 份
                    </p>
                  </div>
                  <span className="text-sm text-amber-400 font-medium">
                    {formatMoney(pkg.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-amber-900/20 rounded-xl border border-purple-500/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <Clock className="inline w-5 h-5 mr-2 text-purple-400" />
              今日数据
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {Math.floor(Math.random() * 20) + 15}
                </p>
                <p className="text-xs text-gray-400">今日预订</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  ¥{(Math.random() * 5000 + 3000).toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">今日营收</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {Math.floor(Math.random() * 50) + 30}
                </p>
                <p className="text-xs text-gray-400">服务客户</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {Math.floor(Math.random() * 10) + 3}
                </p>
                <p className="text-xs text-gray-400">VIP到店</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
