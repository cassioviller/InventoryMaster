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
import { exportToPDF, exportToExcel, formatDate } from '@/lib/export-utils';

type ReportType = 'employee' | 'stock' | 'general' | 'consumption';

interface ReportCard {
  type: ReportType;
  title: string;
  description: string;
  icon: any;
  endpoint: string;
}

const reportCards: ReportCard[] = [
  {
    type: 'employee',
    title: 'Movimentação por Funcionário',
    description: 'Relatório de movimentações realizadas por funcionário específico',
    icon: User,
    endpoint: '/api/reports/employee-movement'
  },
  {
    type: 'stock',
    title: 'Relatório de Estoque',
    description: 'Situação atual do estoque com alertas de itens críticos',
    icon: Package,
    endpoint: '/api/reports/stock'
  },
  {
    type: 'general',
    title: 'Movimentações Gerais',
    description: 'Histórico completo de entradas e saídas de materiais',
    icon: ArrowRightLeft,
    endpoint: '/api/reports/general-movements'
  },
  {
    type: 'consumption',
    title: 'Consumo de Materiais',
    description: 'Análise de consumo de materiais por período',
    icon: BarChart3,
    endpoint: '/api/reports/material-consumption'
  }
];

// Função para preparar dados de exportação
const prepareExportData = (data: any[], reportType: ReportType) => {
  if (!data || data.length === 0) return null;
  
  let title = '';
  let filename = '';
  let headers: string[] = [];
  let rows: any[][] = [];
  
  switch (reportType) {
    case 'employee':
      title = 'Relatório de Movimentação por Funcionário';
      filename = `relatorio-funcionario-${new Date().toISOString().split('T')[0]}`;
      headers = ['Data', 'Funcionário', 'Tipo', 'Material', 'Quantidade', 'Observações'];
      rows = data.map(item => [
        formatDate(item.movement?.date || item.date),
        item.employee?.name || item.employeeName || '-',
        (item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída',
        item.material?.name || item.materialName || '-',
        `${item.quantity || 0} ${item.material?.unit || item.unit || ''}`,
        item.movement?.notes || item.notes || '-'
      ]);
      break;
      
    case 'stock':
      title = 'Relatório de Estoque Atual';
      filename = `relatorio-estoque-${new Date().toISOString().split('T')[0]}`;
      headers = ['Material', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Unidade', 'Status'];
      rows = data.map(item => [
        item.name || item.material?.name,
        item.category || item.categoryName,
        item.currentStock || item.current_stock || 0,
        item.minimumStock || item.minimum_stock || 0,
        item.unit || item.material?.unit || '',
        (item.currentStock || 0) <= (item.minimumStock || 0) ? 'Crítico' : 'Normal'
      ]);
      break;
      
    case 'general':
      title = 'Relatório de Movimentações Gerais';
      filename = `relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}`;
      headers = ['Data', 'Tipo', 'Origem/Destino', 'Materiais', 'Responsável', 'Observações'];
      rows = data.map(item => [
        formatDate(item.date),
        item.type === 'entry' ? 'Entrada' : 'Saída',
        item.supplier || item.employee || item.thirdParty || '-',
        `${item.totalItems || 0} itens`,
        item.user || '-',
        item.notes || '-'
      ]);
      break;
      
    case 'consumption':
      title = 'Relatório de Consumo de Materiais';
      filename = `relatorio-consumo-${new Date().toISOString().split('T')[0]}`;
      headers = ['Material', 'Categoria', 'Quantidade Consumida', 'Unidade', 'Período'];
      rows = data.map(item => [
        item.materialName || '-',
        item.categoryName || '-',
        item.totalQuantity || 0,
        item.unit || '',
        `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
      ]);
      break;
  }
  
  return { title, filename, headers, data: rows };
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: '',
    month: '',
    year: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    type: ''
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const generateReport = async (reportType: ReportType) => {
    setIsLoading(true);
    try {
      const reportCard = reportCards.find(card => card.type === reportType);
      if (!reportCard) return;

      const queryParams = new URLSearchParams();
      
      // Adiciona filtros baseados no tipo de relatório
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') queryParams.append(key, value);
      });

      const response = await authenticatedRequest(`${reportCard.endpoint}?${queryParams}`);
      const data = await response.json();
      
      setReportData(data);
      setSelectedReport(reportType);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedReport || !reportData.length) return;
    
    const exportData = prepareExportData(reportData, selectedReport);
    if (exportData) {
      exportToPDF(exportData);
    }
  };

  const handleExportExcel = () => {
    if (!selectedReport || !reportData.length) return;
    
    const exportData = prepareExportData(reportData, selectedReport);
    if (exportData) {
      exportToExcel(exportData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.type} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-blue-500" />
                  <Button
                    size="sm"
                    onClick={() => generateReport(card.type)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Funcionário</label>
              <Select value={filters.employeeId} onValueChange={(value) => setFilters({...filters, employeeId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {((employees as any) || []).map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select value={filters.categoryId} onValueChange={(value) => setFilters({...filters, categoryId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {((categories as any) || []).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entry">Entrada</SelectItem>
                  <SelectItem value="exit">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {selectedReport && reportData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {reportCards.find(card => card.type === selectedReport)?.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportPDF} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedReport === 'employee' && (
                      <>
                        <TableHead>Data</TableHead>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Observações</TableHead>
                      </>
                    )}
                    {selectedReport === 'stock' && (
                      <>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {selectedReport === 'general' && (
                      <>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Origem/Destino</TableHead>
                        <TableHead>Materiais</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Observações</TableHead>
                      </>
                    )}
                    {selectedReport === 'consumption' && (
                      <>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Quantidade Consumida</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Período</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={index}>
                      {selectedReport === 'employee' && (
                        <>
                          <TableCell>{formatDate(item.movement?.date || item.date)}</TableCell>
                          <TableCell>{item.employee?.name || item.employeeName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={(item.movement?.type || item.type) === 'entry' ? 'default' : 'secondary'}>
                              {(item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.material?.name || item.materialName || '-'}</TableCell>
                          <TableCell>{item.quantity || 0} {item.material?.unit || item.unit || ''}</TableCell>
                          <TableCell>{item.movement?.notes || item.notes || '-'}</TableCell>
                        </>
                      )}
                      {selectedReport === 'stock' && (
                        <>
                          <TableCell>{item.name || item.material?.name}</TableCell>
                          <TableCell>{item.category || item.categoryName}</TableCell>
                          <TableCell>{item.currentStock || item.current_stock || 0}</TableCell>
                          <TableCell>{item.minimumStock || item.minimum_stock || 0}</TableCell>
                          <TableCell>{item.unit || item.material?.unit || ''}</TableCell>
                          <TableCell>
                            <Badge variant={(item.currentStock || 0) <= (item.minimumStock || 0) ? 'destructive' : 'default'}>
                              {(item.currentStock || 0) <= (item.minimumStock || 0) ? 'Crítico' : 'Normal'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedReport === 'general' && (
                        <>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            <Badge variant={item.type === 'entry' ? 'default' : 'secondary'}>
                              {item.type === 'entry' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.supplier || item.employee || item.thirdParty || '-'}</TableCell>
                          <TableCell>{item.totalItems || 0} itens</TableCell>
                          <TableCell>{item.user || '-'}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                        </>
                      )}
                      {selectedReport === 'consumption' && (
                        <>
                          <TableCell>{item.materialName || '-'}</TableCell>
                          <TableCell>{item.categoryName || '-'}</TableCell>
                          <TableCell>{item.totalQuantity || 0}</TableCell>
                          <TableCell>{item.unit || ''}</TableCell>
                          <TableCell>{formatDate(item.startDate)} - {formatDate(item.endDate)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}