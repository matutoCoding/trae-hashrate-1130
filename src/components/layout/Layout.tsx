import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/schedule': { title: '包厢排期', subtitle: '查看和管理所有包厢预订情况' },
  '/recurring': { title: '周期生成', subtitle: '常客周期预订规则管理' },
  '/queue': { title: '排队叫位', subtitle: '实时队列管理与叫号' },
  '/vip': { title: '优先插队', subtitle: 'VIP会员管理与插队处理' },
  '/rooms': { title: '包厢管理', subtitle: '包厢资源建档与配置' },
  '/packages': { title: '酒水套餐', subtitle: '套餐配置与价格管理' },
  '/stats': { title: '数据统计', subtitle: '运营数据报表分析' },
};

export function Layout() {
  const location = useLocation();
  const path = location.pathname;
  const pageInfo = pageTitles[path] || { title: 'KTV管家', subtitle: '' };
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="ml-60">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
