import { useAuth } from '@/hooks/use-auth';
import { Bell, Warehouse, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { authenticatedRequest } from '@/lib/auth-request';

export function Header() {
  const { user, logout } = useAuth();

  // Buscar materiais com estoque baixo para notificações
  const { data: lowStockItems } = useQuery({
    queryKey: ['/api/dashboard/low-stock'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/dashboard/low-stock');
      return res.json();
    },
  });

  const notificationCount = lowStockItems?.length || 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded">
              <Warehouse className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Almoxarifado</h1>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 relative">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Notificações</h4>
                  <div className="space-y-2">
                    {notificationCount === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma notificação</p>
                    ) : (
                      lowStockItems?.map((item: any) => (
                        <div key={item.id} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="font-medium text-red-700">Estoque Baixo</p>
                          <p className="text-red-600">{item.name}: {item.currentStock} {item.unit}</p>
                          <p className="text-xs text-red-500">Mínimo: {item.minimumStock}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
