import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Download, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FinancialReport() {
  const [filters, setFilters] = useState({
    materialSearch: '',
    categoryId: ''
  });

  // Helper function to format currency
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch financial stock data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['/api/reports/financial-stock', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/reports/financial-stock?${params}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch financial report data');
      return response.json();
    }
  });

  // Fetch categories for filter
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

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" to empty string for API compatibility
    const filterValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!Array.isArray(reportData)) return { totalValue: 0, totalItems: 0 };
    
    const totalValue = reportData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalItems = reportData.length;
    
    return { totalValue, totalItems };
  };

  const totals = calculateTotals();

  // Export functions
  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text('Relatório Financeiro de Estoque', 20, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);

      if (Array.isArray(reportData)) {
        const headers = ['Material', 'Categoria', 'Lote', 'Estoque', 'Preço Unit.', 'Valor Total'];
        const rows = reportData.map((item: any) => [
          item.name || '-',
          item.category || '-',
          item.lotInfo || '-',
          `${item.currentStock || 0} ${item.unit || ''}`,
          formatCurrency(item.unitPrice || 0),
          formatCurrency(item.totalValue || 0)
        ]);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 40,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        });

        // Add totals
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.text('RESUMO FINANCEIRO:', 20, finalY);
        doc.setFont("helvetica", "normal");
        doc.text(`Total de Itens: ${totals.totalItems}`, 20, finalY + 10);
        doc.text(`Valor Total do Estoque: ${formatCurrency(totals.totalValue)}`, 20, finalY + 20);
      }

      doc.save(`relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      if (Array.isArray(reportData)) {
        const ws_data = [
          ['Material', 'Categoria', 'Lote', 'Estoque', 'Preço Unit.', 'Valor Total'],
          ...reportData.map((item: any) => [
            item.name || '-',
            item.category || '-',
            item.lotInfo || '-',
            `${item.currentStock || 0} ${item.unit || ''}`,
            item.unitPrice || 0,
            item.totalValue || 0
          ])
        ];

        // Add totals
        ws_data.push([]);
        ws_data.push(['RESUMO FINANCEIRO']);
        ws_data.push(['Total de Itens', totals.totalItems]);
        ws_data.push(['Valor Total do Estoque', totals.totalValue]);

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
        XLSX.writeFile(wb, `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  // Group data by material to show lots
  const groupedData = Array.isArray(reportData) ? reportData.reduce((groups, item) => {
    const materialName = item.name;
    if (!groups[materialName]) {
      groups[materialName] = [];
    }
    groups[materialName].push(item);
    return groups;
  }, {} as Record<string, any[]>) : {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatório Financeiro de Estoque</h1>
          <p className="text-muted-foreground">
            Valores por lote separados por preço de entrada
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Material Search */}
            <div className="space-y-2">
              <Label htmlFor="materialSearch">Buscar Material</Label>
              <Input
                id="materialSearch"
                placeholder="Nome do material..."
                value={filters.materialSearch}
                onChange={(e) => handleFilterChange('materialSearch', e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Array.isArray(categories) && categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total do Estoque</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalValue)}
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
                <p className="text-sm font-medium text-muted-foreground">Total de Lotes</p>
                <p className="text-2xl font-bold">
                  {totals.totalItems}
                </p>
              </div>
              <Calculator className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estoque por Lotes e Preços</CardTitle>
              <CardDescription>
                Valores separados por preço de entrada (FIFO)
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
            <div className="space-y-4">
              {Object.entries(groupedData).map(([materialName, lots]) => (
                <div key={materialName} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{materialName}</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Lote/Preço</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Preço Unitário</TableHead>
                          <TableHead>Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lots.map((lot: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{lot.category || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {lot.lotInfo || 'Lote único'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lot.currentStock} {lot.unit || ''}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(lot.unitPrice || 0)}
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {formatCurrency(lot.totalValue || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Material Total */}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-medium">
                            Total {materialName}:
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="font-bold text-green-700">
                            {formatCurrency(
                              lots.reduce((sum, lot) => sum + (lot.totalValue || 0), 0)
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
              
              {Object.keys(groupedData).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum dado financeiro encontrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}