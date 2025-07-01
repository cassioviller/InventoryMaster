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

  // Helper functions
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

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

  // Fetch report data
  const { data: reportData, isLoading, error, refetch } = useQuery({
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
    const filterValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
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

  const getMovementTypeBadge = (type: string) => {
    switch(type) {
      case 'Entrada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <TrendingUp className="w-3 h-3 mr-1" />
          Entrada
        </Badge>;
      case 'Saída':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <TrendingDown className="w-3 h-3 mr-1" />
          Saída
        </Badge>;
      case 'Devolução':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCcw className="w-3 h-3 mr-1" />
          Devolução
        </Badge>;
      default:
        return <Badge variant="outline">{type || 'N/A'}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Erro ao carregar relatórios</p>
              <p className="text-sm text-gray-600 mt-2">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button onClick={() => refetch()} className="mt-4" size="sm">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Movimentações</h1>
        <p className="text-muted-foreground">
          Visualize e analise todas as movimentações de materiais com filtros avançados
        </p>
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
              <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="entry">Entradas</SelectItem>
                  <SelectItem value="exit">Saídas</SelectItem>
                  <SelectItem value="return">Devoluções</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Center Filter */}
            <div className="space-y-2">
              <Label htmlFor="costCenter">Centro de Custo</Label>
              <Select value={filters.costCenterId || 'all'} onValueChange={(value) => handleFilterChange('costCenterId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os centros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os centros</SelectItem>
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
              <Select value={filters.supplierId || 'all'} onValueChange={(value) => handleFilterChange('supplierId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
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
              <Select value={filters.materialId || 'all'} onValueChange={(value) => handleFilterChange('materialId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os materiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os materiais</SelectItem>
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
              <Select value={filters.categoryId || 'all'} onValueChange={(value) => handleFilterChange('categoryId', value)}>
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

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totals Summary */}
      {reportData?.totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-600">Total Entradas</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(reportData.totals.totalEntries || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-600">Total Saídas</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(reportData.totals.totalExits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <RefreshCcw className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Devoluções</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(reportData.totals.totalReturns || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Movimentações</span>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Carregando relatórios...</p>
              </div>
            </div>
          ) : reportData?.movements && reportData.movements.length > 0 ? (
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
                  {reportData.movements.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell>{formatDate(movement.date)}</TableCell>
                      <TableCell>{getMovementTypeBadge(movement.displayType)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.material?.name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{movement.material?.category?.name || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.quantity || 0} {movement.material?.unit || ''}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(movement.totalValue || 0)}
                      </TableCell>
                      <TableCell>
                        {movement.costCenter ? `${movement.costCenter.code} - ${movement.costCenter.name}` : '-'}
                      </TableCell>
                      <TableCell>{movement.originDestination || '-'}</TableCell>
                      <TableCell>{movement.responsiblePerson || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-muted-foreground">
                Não há dados para o período e filtros selecionados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}