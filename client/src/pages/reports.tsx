import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Package, 
  ArrowRightLeft, 
  BarChart3,
  Eye,
  FileText,
  Download,
  Loader2,
  Calendar,
  Building2
} from 'lucide-react';
import { authenticatedRequest } from '@/lib/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFilters {
  employeeId?: string;
  categoryId?: string;
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
}

export default function Reports() {
  const [employeeFilters, setEmployeeFilters] = useState<ReportFilters>({
    year: '2025',
  });
  const [stockFilters, setStockFilters] = useState<ReportFilters>({});
  const [movementFilters, setMovementFilters] = useState<ReportFilters>({});
  const [consumptionFilters, setConsumptionFilters] = useState<ReportFilters>({});
  
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportType, setReportType] = useState<'employee' | 'stock' | 'movements' | 'consumption'>('employee');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ['/api/employees?active=true'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/employees?active=true');
      return res.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/categories');
      return res.json();
    },
  });

  const generateEmployeeReport = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (employeeFilters.employeeId && employeeFilters.employeeId !== 'all') params.append('employeeId', employeeFilters.employeeId);
      if (employeeFilters.month) params.append('month', employeeFilters.month);
      if (employeeFilters.year) params.append('year', employeeFilters.year);
      
      const res = await authenticatedRequest(`/api/reports/employee-movements?${params}`);
      const data = await res.json();
      
      setReportData(data);
      setReportType('employee');
      setReportTitle('Relatório de Movimentação por Funcionário');
      setReportDialogOpen(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStockReport = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (stockFilters.categoryId && stockFilters.categoryId !== 'all') params.append('categoryId', stockFilters.categoryId);
      
      const res = await authenticatedRequest(`/api/reports/stock?${params}`);
      const data = await res.json();
      
      setReportData(data);
      setReportType('stock');
      setReportTitle('Relatório de Estoque Atual');
      setReportDialogOpen(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMovementReport = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (movementFilters.startDate) params.append('startDate', movementFilters.startDate);
      if (movementFilters.endDate) params.append('endDate', movementFilters.endDate);
      if (movementFilters.type && movementFilters.type !== 'all') params.append('type', movementFilters.type);
      
      const res = await authenticatedRequest(`/api/reports/general-movements?${params}`);
      const data = await res.json();
      
      setReportData(data);
      setReportType('movements');
      setReportTitle('Relatório de Movimentações Gerais');
      setReportDialogOpen(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateConsumptionReport = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (consumptionFilters.startDate) params.append('startDate', consumptionFilters.startDate);
      if (consumptionFilters.endDate) params.append('endDate', consumptionFilters.endDate);
      if (consumptionFilters.categoryId && consumptionFilters.categoryId !== 'all') params.append('categoryId', consumptionFilters.categoryId);
      
      const res = await authenticatedRequest(`/api/reports/material-consumption?${params}`);
      const data = await res.json();
      
      setReportData(data);
      setReportType('consumption');
      setReportTitle('Relatório de Consumo por Material');
      setReportDialogOpen(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const monthOptions = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Employee Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Por Funcionário</CardTitle>
              <p className="text-sm text-gray-600">Histórico de saídas e devoluções</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
            <Select 
              value={employeeFilters.employeeId} 
              onValueChange={(value) => setEmployeeFilters(prev => ({ ...prev, employeeId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {employees?.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name} - {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
              <Select 
                value={employeeFilters.month} 
                onValueChange={(value) => setEmployeeFilters(prev => ({ ...prev, month: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
              <Select 
                value={employeeFilters.year} 
                onValueChange={(value) => setEmployeeFilters(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={generateEmployeeReport}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Stock Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded">
              <Package className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Estoque Atual</CardTitle>
              <p className="text-sm text-gray-600">Lista completa de materiais</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <Select 
              value={stockFilters.categoryId} 
              onValueChange={(value) => setStockFilters(prev => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-16">
            <Button 
              onClick={generateStockReport}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Movements Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-50 rounded">
              <ArrowRightLeft className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Movimentações Gerais</CardTitle>
              <p className="text-sm text-gray-600">Log de entradas e saídas</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
              <Input 
                type="date" 
                value={movementFilters.startDate || ''}
                onChange={(e) => setMovementFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
              <Input 
                type="date" 
                value={movementFilters.endDate || ''}
                onChange={(e) => setMovementFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <Select 
              value={movementFilters.type} 
              onValueChange={(value) => setMovementFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entry">Entrada</SelectItem>
                <SelectItem value="exit">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={generateMovementReport}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Material Consumption Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
              <BarChart3 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Consumo por Material</CardTitle>
              <p className="text-sm text-gray-600">Total de saídas por período</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
              <Input 
                type="date" 
                value={consumptionFilters.startDate || ''}
                onChange={(e) => setConsumptionFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
              <Input 
                type="date" 
                value={consumptionFilters.endDate || ''}
                onChange={(e) => setConsumptionFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <Select 
              value={consumptionFilters.categoryId} 
              onValueChange={(value) => setConsumptionFilters(prev => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={generateConsumptionReport}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
