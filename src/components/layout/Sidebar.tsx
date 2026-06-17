import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Repeat,
  Users,
  Crown,
  Music,
  Wine,
  BarChart3,
  Mic2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/schedule', label: '包厢排期', icon: CalendarDays },
  { path: '/recurring', label: '周期生成', icon: Repeat },
  { path: '/queue', label: '排队叫位', icon: Users },
  { path: '/vip', label: '优先插队', icon: Crown },
  { path: '/rooms', label: '包厢管理', icon: Music },
  { path: '/packages', label: '酒水套餐', icon: Wine },
  { path: '/stats', label: '数据统计', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
            <Mic2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">KTV管家</h1>
            <p className="text-xs text-gray-500">预订管理系统</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gradient-to-br from-purple-900/50 to-amber-900/30 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">管理员</p>
              <p className="text-xs text-gray-400">admin@ktv.com</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            今日预订: <span className="text-purple-400 font-medium">28</span> 单
          </div>
        </div>
      </div>
    </aside>
  );
}
