import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Receipt, Settings } from 'lucide-react';
import { classNames } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/receipts', label: 'Receipts', icon: Receipt },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={classNames(
        'fixed left-0 top-0 h-full bg-base-surface border-r border-base-border z-30 transition-all duration-200 flex flex-col',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className={classNames('h-14 flex items-center border-b border-base-border px-4', collapsed ? 'justify-center' : '')}>
        <span className={classNames('font-heading font-bold text-text-primary text-h3', collapsed ? 'text-base' : '')}>
          {collapsed ? 'K' : 'Kashlet'}
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-sm px-3 py-2 text-body-m font-medium transition-colors duration-150',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-base-card hover:text-text-primary',
                collapsed && 'justify-center px-0'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
