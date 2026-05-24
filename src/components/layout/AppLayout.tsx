import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { classNames } from '../../lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setCollapsed(false);
        setMobileOpen(false);
      } else {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else if (window.innerWidth < 1024) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const sidebarWidth = collapsed ? 'w-16' : 'w-56';
  const sidebarOffset = collapsed ? 'lg:left-16' : 'lg:left-56';

  return (
    <div className="min-h-screen bg-base-bg">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar collapsed={false} />
          </div>
        </div>
      )}

      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} />
      </div>

      <div className={classNames('fixed top-0 right-0 h-14 z-20 transition-all duration-200', sidebarOffset, 'left-0 md:left-auto')}>
        <TopNav onToggleSidebar={toggleSidebar} />
      </div>

      <main
        className={classNames(
          'pt-14 min-h-screen transition-all duration-200',
          collapsed ? 'lg:pl-16' : 'lg:pl-56'
        )}
      >
        <div className="max-w-content mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
