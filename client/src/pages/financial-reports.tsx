import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Package, TrendingUp, Download, FileText } from "lucide-react";
import { exportToPDF, exportToExcel, formatCurrency } from "@/lib/export-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FinancialStockItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitPrice: number;
  subtotal: number;
}

export default function FinancialReports() {
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'value'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['/api/reports/financial-stock'],
  });

  const sortedData = reportData && Array.isArray(reportData) ? [...reportData].sort((a: FinancialStockItem, b: FinancialStockItem) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'category':
        compareValue = a.category.localeCompare(b.category);
        break;
      case 'value':
        compareValue = a.subtotal - b.subtotal;
        break;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  }) : [];

  const totalValue = sortedData.reduce((sum: number, item: FinancialStockItem) => sum + item.subtotal, 0);
  const totalItems = sortedData.length;
  const highValueItems = sortedData.filter((item: FinancialStockItem) => item.subtotal > 1000).length;

  const handleExportPDF = () => {
    if (!sortedData.length) return;
    
    const exportData = {
      title: 'Relatório Financeiro do Estoque',
      filename: `relatorio-financeiro-${new Date().toISOString().split('T')[0]}`,
      headers: ['Material', 'Categoria', 'Estoque', 'Unidade', 'Preço Unit.', 'Valor Total'],
      data: sortedData.map(item => [
        item.name,
        item.category,
        item.currentStock.toString(),
        item.unit,
        formatCurrency(item.unitPrice),
        formatCurrency(item.subtotal)
      ])
    };
    
    exportToPDF(exportData);
  };

  const handleExportExcel = () => {
    if (!sortedData.length) return;
    
    const exportData = {
      title: 'Relatório Financeiro do Estoque',
      filename: `relatorio-financeiro-${new Date().toISOString().split('T')[0]}`,
      headers: ['Material', 'Categoria', 'Estoque', 'Unidade', 'Preço Unitário', 'Valor Total'],
      data: sortedData.map(item => [
        item.name,
        item.category,
        item.currentStock,
        item.unit,
        item.unitPrice,
        item.subtotal
      ])
    };
    
    exportToExcel(exportData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Erro ao carregar relatório financeiro</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatório Financeiro do Estoque</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button 
            onClick={() => window.print()}
            variant="outline"
            size="sm"
          >
            Imprimir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens de Alto Valor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highValueItems}</div>
            <p className="text-xs text-muted-foreground">Acima de R$ 1.000</p>
          </CardContent>
        </Card>
      </div>

      {/* Sorting Controls */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Ordenar por:</span>
        <Button
          variant={sortBy === 'name' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('name')}
        >
          Nome
        </Button>
        <Button
          variant={sortBy === 'category' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('category')}
        >
          Categoria
        </Button>
        <Button
          variant={sortBy === 'value' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('value')}
        >
          Valor
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Financial Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Material</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Valor Unitário</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item: FinancialStockItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.currentStock}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Valor Total do Estoque:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}