import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Filter, Download, FileText, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  // Filters state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    costCenterId: '',
    supplierId: '',
    materialId: '',
    categoryId: ''
  });

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Helper function to format currency
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch enhanced movements data with totals
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['/api/reports/general-movements-enhanced', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/reports/general-movements-enhanced?${params}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch report data');
      return response.json();
    }
  });

  // Fetch lookup data for filters
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: suppliers } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    }
  });

  const { data: costCenters } = useQuery({
    queryKey: ['/api/cost-centers'],
    queryFn: async () => {
      const response = await fetch('/api/cost-centers', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch cost centers');
      return response.json();
    }
  });

  const { data: materials } = useQuery({
    queryKey: ['/api/materials'],
    queryFn: async () => {
      const response = await fetch('/api/materials', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch materials');
      return response.json();
    }
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      costCenterId: '',
      supplierId: '',
      materialId: '',
      categoryId: ''
    });
  };

  // Export functions
  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text('Relatório de Movimentações Gerais', 20, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);

      if (reportData?.movements) {
        const headers = ['Data', 'Tipo', 'Material', 'Quantidade', 'Valor Total', 'Centro de Custo', 'Origem/Destino', 'Responsável'];
        const rows = reportData.movements.map((item: any) => [
          formatDate(item.date),
          item.displayType || 'N/A',
          item.material?.name || '-',
          `${item.quantity || 0} ${item.material?.unit || ''}`,
          formatCurrency(item.totalValue || 0),
          item.costCenter ? `${item.costCenter.code} - ${item.costCenter.name}` : '-',
          item.originDestination || '-',
          item.responsiblePerson || '-'
        ]);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 40,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        });

        // Add totals
        if (reportData.totals) {
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFont("helvetica", "bold");
          doc.text('TOTALIZADORES:', 20, finalY);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Entradas: ${formatCurrency(reportData.totals.totalEntries)}`, 20, finalY + 10);
          doc.text(`Total Saídas: ${formatCurrency(reportData.totals.totalExits)}`, 20, finalY + 20);
          doc.text(`Total Devoluções: ${formatCurrency(reportData.totals.totalReturns)}`, 20, finalY + 30);
          doc.text(`Total Geral: ${formatCurrency(reportData.totals.totalGeneral)}`, 20, finalY + 40);
        }
      }

      doc.save(`relatorio-movimentacoes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      if (reportData?.movements) {
        const ws_data = [
          ['Data', 'Tipo', 'Material', 'Quantidade', 'Valor Total', 'Centro de Custo', 'Origem/Destino', 'Responsável'],
          ...reportData.movements.map((item: any) => [
            formatDate(item.date),
            item.displayType || 'N/A',
            item.material?.name || '-',
            `${item.quantity || 0} ${item.material?.unit || ''}`,
            item.totalValue || 0,
            item.costCenter ? `${item.costCenter.code} - ${item.costCenter.name}` : '-',
            item.originDestination || '-',
            item.responsiblePerson || '-'
          ])
        ];

        // Add totals
        if (reportData.totals) {
          ws_data.push([]);
          ws_data.push(['TOTALIZADORES']);
          ws_data.push(['Total Entradas', reportData.totals.totalEntries]);
          ws_data.push(['Total Saídas', reportData.totals.totalExits]);
          ws_data.push(['Total Devoluções', reportData.totals.totalReturns]);
          ws_data.push(['Total Geral', reportData.totals.totalGeneral]);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
        XLSX.writeFile(wb, `relatorio-movimentacoes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Movimentações</h1>
          <p className="text-muted-foreground">
            Análise completa de entradas, saídas e devoluções com filtros avançados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          <CardDescription>
            Use os filtros abaixo para personalizar o relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Movimentação</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="entry">Entradas</SelectItem>
                  <SelectItem value="exit">Saídas</SelectItem>
                  <SelectItem value="return">Devoluções</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Center Filter */}
            <div className="space-y-2">
              <Label htmlFor="costCenter">Centro de Custo</Label>
              <Select value={filters.costCenterId} onValueChange={(value) => handleFilterChange('costCenterId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os centros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os centros</SelectItem>
                  {Array.isArray(costCenters) && costCenters.map((center: any) => (
                    <SelectItem key={center.id} value={center.id.toString()}>
                      {center.code} - {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={filters.supplierId} onValueChange={(value) => handleFilterChange('supplierId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os fornecedores</SelectItem>
                  {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Material Filter */}
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select value={filters.materialId} onValueChange={(value) => handleFilterChange('materialId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os materiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os materiais</SelectItem>
                  {Array.isArray(materials) && materials.map((material: any) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {Array.isArray(categories) && categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totals Section */}
      {reportData?.totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Entradas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.totals.totalEntries)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Saídas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(reportData.totals.totalExits)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Devoluções</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(reportData.totals.totalReturns)}
                  </p>
                </div>
                <RefreshCcw className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Geral</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(reportData.totals.totalGeneral)}
                  </p>
                </div>
                <FileText className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimentações Detalhadas</CardTitle>
              <CardDescription>
                {reportData?.movements?.length || 0} registros encontrados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Origem/Destino</TableHead>
                    <TableHead>Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(reportData?.movements) && reportData.movements.length > 0 ? (
                    reportData.movements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>{formatDate(movement.date)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              movement.displayType === 'Entrada' ? 'default' :
                              movement.displayType === 'Saída' ? 'destructive' : 'secondary'
                            }
                          >
                            {movement.displayType || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.material?.name || '-'}</TableCell>
                        <TableCell>
                          {movement.quantity} {movement.material?.unit || ''}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(movement.totalValue || 0)}
                        </TableCell>
                        <TableCell>
                          {movement.costCenter ? 
                            `${movement.costCenter.code} - ${movement.costCenter.name}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{movement.originDestination || '-'}</TableCell>
                        <TableCell>{movement.responsiblePerson || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhuma movimentação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}