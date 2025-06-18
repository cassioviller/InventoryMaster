import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Package, 
  ArrowRightLeft, 
  BarChart3,
  FileText,
  Download,
  Loader2,
  Filter,
  RefreshCw,
  Truck
} from 'lucide-react';
import { authenticatedRequest } from '@/lib/auth';
import { exportToPDF, exportToExcel } from '@/lib/export-utils';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: 'all',
    categoryId: 'all',
    startDate: '',
    endDate: '',
    type: 'all'
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Efeito para atualizar automaticamente os relatórios quando os filtros mudarem
  useEffect(() => {
    if (activeReport && !isLoading) {
      const timer = setTimeout(() => {
        switch (activeReport) {
          case 'employee':
            generateEmployeeReport();
            break;
          case 'stock':
            generateStockReport();
            break;
          case 'movements':
            generateMovementsReport();
            break;
          case 'consumption':
            generateConsumptionReport();
            break;
          case 'supplier-tracking':
            generateSupplierTrackingReport();
            break;
        }
      }, 500); // Debounce de 500ms para evitar múltiplas requisições

      return () => clearTimeout(timer);
    }
  }, [filters.startDate, filters.endDate, filters.employeeId, filters.categoryId, filters.type]);

  // Função para formatar data de forma segura
  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const generateEmployeeReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.employeeId && filters.employeeId !== 'all') {
        params.append('employeeId', filters.employeeId);
      }
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await authenticatedRequest(`/api/reports/employee-movement?${params}`);
      const data = await response.json();
      setReportData(Array.isArray(data) ? data : []);
      setActiveReport('employee');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateStockReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categoryId && filters.categoryId !== 'all') {
        params.append('categoryId', filters.categoryId);
      }

      const response = await authenticatedRequest(`/api/reports/stock?${params}`);
      const data = await response.json();
      setReportData(Array.isArray(data) ? data : []);
      setActiveReport('stock');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSupplierTrackingReport = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedRequest('/api/reports/supplier-tracking');
      const data = await response.json();
      setReportData(Array.isArray(data) ? data : []);
      setActiveReport('supplier-tracking');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMovementsReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }

      const response = await authenticatedRequest(`/api/reports/general-movements?${params}`);
      const data = await response.json();
      setReportData(Array.isArray(data) ? data : []);
      setActiveReport('movements');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateConsumptionReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.categoryId && filters.categoryId !== 'all') {
        params.append('categoryId', filters.categoryId);
      }

      const response = await authenticatedRequest(`/api/reports/material-consumption?${params}`);
      const data = await response.json();
      setReportData(Array.isArray(data) ? data : []);
      setActiveReport('consumption');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDFReport = () => {
    if (!activeReport || !reportData.length) return;

    let title = '';
    let filename = '';
    let headers: string[] = [];
    let rows: any[][] = [];

    switch (activeReport) {
      case 'employee':
        title = 'Relatório de Movimentação por Funcionário';
        filename = `relatorio-funcionario-${new Date().toISOString().split('T')[0]}`;
        headers = ['Data', 'Funcionário', 'Tipo', 'Material', 'Quantidade', 'Observações'];
        rows = reportData.map(item => [
          formatDate(item.movement?.date || item.date),
          item.employee?.name || item.employeeName || '-',
          (item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída',
          item.material?.name || item.materialName || '-',
          `${item.quantity || 0} ${item.material?.unit || item.unit || ''}`,
          item.movement?.notes || item.notes || '-'
        ]);
        break;
      case 'stock':
        title = 'Relatório de Estoque';
        filename = `relatorio-estoque-${new Date().toISOString().split('T')[0]}`;
        headers = ['Material', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Unidade', 'Status'];
        rows = reportData.map(item => [
          item.name || '-',
          item.categoryName || '-',
          item.current_stock || 0,
          item.minimum_stock || 0,
          item.unit || '',
          (item.current_stock || 0) <= (item.minimum_stock || 0) ? 'Crítico' : 'Normal'
        ]);
        break;
      case 'movements':
        title = 'Relatório de Movimentações';
        filename = `relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}`;
        headers = ['Data', 'Tipo', 'Material', 'Quantidade', 'Origem/Destino', 'Responsável'];
        rows = reportData.map(item => [
          formatDate(item.movement?.date || item.date),
          (item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída',
          item.material?.name || '-',
          `${item.items?.quantity || 0} ${item.material?.unit || ''}`,
          item.supplier?.name || item.employee?.name || item.thirdParty?.name || '-',
          item.user?.username || '-'
        ]);
        break;
      case 'consumption':
        title = 'Relatório de Consumo';
        filename = `relatorio-consumo-${new Date().toISOString().split('T')[0]}`;
        headers = ['Material', 'Categoria', 'Quantidade Consumida', 'Unidade'];
        rows = reportData.map(item => [
          item.material?.name || item.materialName || '-',
          item.category?.name || item.categoryName || '-',
          item.totalConsumed || 0,
          item.material?.unit || item.unit || ''
        ]);
        break;
      case 'financial':
        title = 'Relatório Financeiro de Estoque';
        filename = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}`;
        headers = ['Material', 'Categoria', 'Estoque', 'Preço Unit.', 'Subtotal'];
        const totalValue = reportData.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        rows = [
          ...reportData.map(item => [
            item.name || '-',
            item.category || '-',
            `${item.currentStock || 0} ${item.unit || ''}`,
            `R$ ${(item.unitPrice || 0).toFixed(2)}`,
            `R$ ${(item.subtotal || 0).toFixed(2)}`
          ]),
          ['', '', '', 'TOTAL GERAL:', `R$ ${totalValue.toFixed(2)}`]
        ];
        break;
    }

    exportToPDF({ title, filename, headers, data: rows });
  };

  const exportToExcelReport = () => {
    if (!activeReport || !reportData.length) return;

    let title = '';
    let filename = '';
    let headers: string[] = [];
    let rows: any[][] = [];

    switch (activeReport) {
      case 'employee':
        title = 'Relatório de Movimentação por Funcionário';
        filename = `relatorio-funcionario-${new Date().toISOString().split('T')[0]}`;
        headers = ['Data', 'Funcionário', 'Tipo', 'Material', 'Quantidade', 'Observações'];
        rows = reportData.map(item => [
          formatDate(item.movement?.date || item.date),
          item.employee?.name || item.employeeName || '-',
          (item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída',
          item.material?.name || item.materialName || '-',
          `${item.quantity || 0} ${item.material?.unit || item.unit || ''}`,
          item.movement?.notes || item.notes || '-'
        ]);
        break;
      case 'stock':
        title = 'Relatório de Estoque';
        filename = `relatorio-estoque-${new Date().toISOString().split('T')[0]}`;
        headers = ['Material', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Unidade', 'Status'];
        rows = reportData.map(item => [
          item.name || '-',
          item.categoryName || '-',
          item.current_stock || 0,
          item.minimum_stock || 0,
          item.unit || '',
          (item.current_stock || 0) <= (item.minimum_stock || 0) ? 'Crítico' : 'Normal'
        ]);
        break;
      case 'movements':
        title = 'Relatório de Movimentações';
        filename = `relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}`;
        headers = ['Data', 'Tipo', 'Material', 'Quantidade', 'Origem/Destino', 'Responsável'];
        rows = reportData.map(item => [
          formatDate(item.movement?.date || item.date),
          (item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída',
          item.material?.name || '-',
          `${item.items?.quantity || 0} ${item.material?.unit || ''}`,
          item.supplier?.name || item.employee?.name || item.thirdParty?.name || '-',
          item.user?.username || '-'
        ]);
        break;
      case 'consumption':
        title = 'Relatório de Consumo';
        filename = `relatorio-consumo-${new Date().toISOString().split('T')[0]}`;
        headers = ['Material', 'Categoria', 'Quantidade Consumida', 'Unidade'];
        rows = reportData.map(item => [
          item.material?.name || item.materialName || '-',
          item.category?.name || item.categoryName || '-',
          item.totalConsumed || 0,
          item.material?.unit || item.unit || ''
        ]);
        break;
      case 'financial':
        title = 'Relatório Financeiro de Estoque';
        filename = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}`;
        headers = ['Material', 'Categoria', 'Estoque', 'Preço Unit.', 'Subtotal'];
        const totalValueExcel = reportData.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        rows = [
          ...reportData.map(item => [
            item.name || '-',
            item.category || '-',
            `${item.currentStock || 0} ${item.unit || ''}`,
            `R$ ${(item.unitPrice || 0).toFixed(2)}`,
            `R$ ${(item.subtotal || 0).toFixed(2)}`
          ]),
          ['', '', '', 'TOTAL GERAL:', `R$ ${totalValueExcel.toFixed(2)}`]
        ];
        break;
    }

    exportToExcel({ title, filename, headers, data: rows });
  };

  const clearFilters = () => {
    setFilters({
      employeeId: 'all',
      categoryId: 'all',
      startDate: '',
      endDate: '',
      type: 'all'
    });
    setReportData([]);
    setActiveReport(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button onClick={clearFilters} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Report Generation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Movimentação por Funcionário</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button 
              onClick={generateEmployeeReport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeReport === 'employee' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Relatório de Estoque</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button 
              onClick={generateStockReport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeReport === 'stock' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Movimentações Gerais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button 
              onClick={generateMovementsReport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeReport === 'movements' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Consumo de Materiais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button 
              onClick={generateConsumptionReport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeReport === 'consumption' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-teal-500" />
              <CardTitle className="text-lg">Rastreamento de Fornecedores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button 
              onClick={generateSupplierTrackingReport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && activeReport === 'supplier-tracking' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Funcionário</label>
              <Select value={filters.employeeId} onValueChange={(value) => setFilters({...filters, employeeId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {((employees as any) || []).map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={filters.categoryId} onValueChange={(value) => setFilters({...filters, categoryId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {((categories as any) || []).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Data Início</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
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
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {activeReport && reportData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeReport === 'employee' && 'Relatório de Movimentação por Funcionário'}
                {activeReport === 'stock' && 'Relatório de Estoque'}
                {activeReport === 'movements' && 'Relatório de Movimentações Gerais'}
                {activeReport === 'consumption' && 'Relatório de Consumo de Materiais'}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({reportData.length} registros)
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportToPDFReport} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={exportToExcelReport} variant="outline" size="sm">
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
                    {activeReport === 'employee' && (
                      <>
                        <TableHead>Data</TableHead>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Observações</TableHead>
                      </>
                    )}
                    {activeReport === 'stock' && (
                      <>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {activeReport === 'movements' && (
                      <>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Origem/Destino</TableHead>
                        <TableHead>Responsável</TableHead>
                      </>
                    )}
                    {activeReport === 'consumption' && (
                      <>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Quantidade Consumida</TableHead>
                        <TableHead>Unidade</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={index}>
                      {activeReport === 'employee' && (
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
                      {activeReport === 'stock' && (
                        <>
                          <TableCell>{item.name || '-'}</TableCell>
                          <TableCell>{item.categoryName || '-'}</TableCell>
                          <TableCell>{item.current_stock || 0}</TableCell>
                          <TableCell>{item.minimum_stock || 0}</TableCell>
                          <TableCell>{item.unit || ''}</TableCell>
                          <TableCell>
                            <Badge variant={(item.current_stock || 0) <= (item.minimum_stock || 0) ? 'destructive' : 'default'}>
                              {(item.current_stock || 0) <= (item.minimum_stock || 0) ? 'Crítico' : 'Normal'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {activeReport === 'movements' && (
                        <>
                          <TableCell>{formatDate(item.movement?.date || item.date)}</TableCell>
                          <TableCell>
                            <Badge variant={(item.movement?.type || item.type) === 'entry' ? 'default' : 'secondary'}>
                              {(item.movement?.type || item.type) === 'entry' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.material?.name || '-'}</TableCell>
                          <TableCell>{item.items?.quantity || 0} {item.material?.unit || ''}</TableCell>
                          <TableCell>
                            {item.supplier?.name || item.employee?.name || item.thirdParty?.name || '-'}
                          </TableCell>
                          <TableCell>{item.user?.username || '-'}</TableCell>
                        </>
                      )}
                      {activeReport === 'consumption' && (
                        <>
                          <TableCell>{item.material?.name || item.materialName || '-'}</TableCell>
                          <TableCell>{item.category?.name || item.categoryName || '-'}</TableCell>
                          <TableCell>{item.totalConsumed || 0}</TableCell>
                          <TableCell>{item.material?.unit || item.unit || ''}</TableCell>
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

      {/* Empty State */}
      {activeReport && reportData.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground">
                Não foram encontrados dados para os filtros selecionados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}