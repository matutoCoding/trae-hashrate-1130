import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Schedule from '@/pages/Schedule';
import Recurring from '@/pages/Recurring';
import Queue from '@/pages/Queue';
import Vip from '@/pages/Vip';
import Rooms from '@/pages/Rooms';
import Packages from '@/pages/Packages';
import Stats from '@/pages/Stats';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { useQueueStore } from '@/stores/useQueueStore';

export default function App() {
  const loadBookingStorage = useBookingStore((state) => state.loadFromStorage);
  const loadCustomerStorage = useCustomerStore((state) => state.loadFromStorage);
  const loadQueueStorage = useQueueStore((state) => state.loadFromStorage);
  
  useEffect(() => {
    loadBookingStorage();
    loadCustomerStorage();
    loadQueueStorage();
  }, []);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/schedule" replace />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="queue" element={<Queue />} />
          <Route path="vip" element={<Vip />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="packages" element={<Packages />} />
          <Route path="stats" element={<Stats />} />
        </Route>
      </Routes>
    </Router>
  );
}
