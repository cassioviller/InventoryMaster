import { 
  LayoutDashboard, 
  ArrowDown, 
  ArrowUp, 
  Settings, 
  BarChart3,
  DollarSign
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/material-entry',
    label: 'Entrada de Material',
    icon: ArrowDown,
  },
  {
    path: '/material-exit',
    label: 'Saída de Material',
    icon: ArrowUp,
  },
  {
    path: '/management',
    label: 'Cadastros',
    icon: Settings,
  },
  {
    path: '/reports',
    label: 'Relatórios',
    icon: BarChart3,
  },
  {
    path: '/financial-reports',
    label: 'Relatório Financeiro',
    icon: DollarSign,
  },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
