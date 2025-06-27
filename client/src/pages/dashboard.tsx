import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Package, 
  ArrowDown, 
  ArrowUp,
  Loader2
} from 'lucide-react';
import { authenticatedRequest } from '@/lib/auth-request';
import type { Material, Category } from '@shared/schema';

interface DashboardStats {
  totalMaterials: number;
  entriesToday: number;
  exitsToday: number;
  criticalItems: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/dashboard/stats');
      return res.json() as Promise<DashboardStats>;
    },
    enabled: !!localStorage.getItem('token'),
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['/api/dashboard/low-stock'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/dashboard/low-stock');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!localStorage.getItem('token'),
  });

  const lowStockMaterials = lowStockData || [];

  if (statsLoading || lowStockLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stock Alerts */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Alertas de Estoque</h2>
        
        {lowStockMaterials && lowStockMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {lowStockMaterials.map((material) => (
              <Card key={material.id} className="bg-warning border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-warning-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {material.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Estoque atual: <span className="font-medium">{material.currentStock}</span> | 
                        Mínimo: <span className="font-medium">{material.minimumStock}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Categoria: {material.category.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum alerta de estoque
              </h3>
              <p className="text-gray-600">
                Todos os materiais estão com estoque adequado.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Materiais</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.totalMaterials || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entradas Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.entriesToday || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
                  <ArrowDown className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saídas Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.exitsToday || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-lg">
                  <ArrowUp className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Itens Críticos</p>
                  <p className="text-3xl font-bold text-red-500">
                    {stats?.criticalItems || 0}
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
