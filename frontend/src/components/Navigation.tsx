import { MdDashboard, MdReceipt, MdInsights, MdSettings, MdFlag } from 'react-icons/md';

interface NavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'expenses', label: 'Expenses', icon: MdReceipt },
  { id: 'goals', label: 'Goals', icon: MdFlag },
  { id: 'insights', label: 'Insights', icon: MdInsights },
  { id: 'settings', label: 'Settings', icon: MdSettings },
];

export function Navigation({ activePage, onNavigate }: NavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-current={activePage === item.id ? 'page' : undefined}
          aria-label={item.label}
        >
          <item.icon className="nav-icon" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
