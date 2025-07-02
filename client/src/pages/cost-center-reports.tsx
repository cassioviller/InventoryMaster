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
import { Calendar, Download, FileText, TrendingUp, TrendingDown, DollarSign, Building2, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CostCenterReports() {
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportType, setReportType] = useState<string>("movements");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch cost centers
  const { data: costCenters = [] } = useQuery({
    queryKey: ["/api/cost-centers"],
  });

  // Fetch cost center report
  const { data: reportData = [], isLoading: reportLoading } = useQuery({
    queryKey: ["/api/reports/cost-center", selectedCostCenter, startDate, endDate],
    enabled: !!selectedCostCenter,
  });

  // Fetch general movements with cost center filter
  const { data: movementsData = [], isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/reports/general-movements", startDate, endDate, "", selectedCostCenter],
    enabled: reportType === "movements",
  });

  const calculateTotals = (data: any[]) => {
    return data.reduce((acc, item) => {
      const unitPrice = parseFloat(item.unitPrice || '0');
      const totalValue = item.quantity * unitPrice;
      
      // Verificar se é devolução (entrada com originType de devolução)
      const isReturn = item.type === 'entry' && 
        (item.originType === 'employee_return' || item.originType === 'third_party_return');
      
      if (isReturn) {
        acc.totalReturns += totalValue;
        acc.returnCount += 1;
      } else if (item.type === 'exit') {
        acc.totalExits += totalValue;
        acc.exitCount += 1;
      }
      
      return acc;
    }, {
      totalExits: 0,
      totalReturns: 0,
      exitCount: 0,
      returnCount: 0
    });
  };

  const totals = calculateTotals(reportType === "movements" ? movementsData : reportData);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Filter data - only exits and returns, never supplier entries
  const filterData = (data: any[]) => {
    // First filter: only exits and returns (never supplier entries)
    let filteredData = data.filter((item: any) => {
      if (item.type === 'exit') return true;
      if (item.type === 'entry' && (item.originType === 'employee_return' || item.originType === 'third_party_return')) return true;
      return false;
    });
    
    // Second filter: search term
    if (!searchTerm.trim()) return filteredData;
    
    return filteredData.filter((item: any) => {
      const searchText = searchTerm.toLowerCase();
      return (
        item.material?.name?.toLowerCase().includes(searchText) ||
        item.notes?.toLowerCase().includes(searchText) ||
        item.costCenter?.code?.toLowerCase().includes(searchText) ||
        item.costCenter?.name?.toLowerCase().includes(searchText) ||
        item.displayType?.toLowerCase().includes(searchText)
      );
    });
  };

  const exportToCSV = () => {
    const data = reportType === "movements" ? movementsData : reportData;
    const csvContent = [
      ["Data", "Tipo", "Material", "Quantidade", "Preço Unitário", "Valor Total", "Centro de Custo", "Funcionário/Terceiro", "Observações"],
      ...data.map((item: any) => [
        format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }),
        item.type === 'entry' ? 'Entrada' : 'Saída',
        item.material?.name || '',
        item.quantity,
        item.unitPrice || '0',
        formatCurrency(item.quantity * parseFloat(item.unitPrice || '0')),
        item.costCenter?.name || '',
        item.employee?.name || item.thirdParty?.name || '',
        item.notes || ''
      ])
    ].map(row => row.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-centro-custo-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Centro de Custo</h1>
          <p className="text-muted-foreground">
            Análise detalhada de movimentações por centro de custo com valores financeiros
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!selectedCostCenter}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="costCenter">Centro de Custo</Label>
            <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar centro" />
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

          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar por material, observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movements">Movimentações Gerais</SelectItem>
                <SelectItem value="cost-center">Relatório por Centro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="w-full"
            >
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {selectedCostCenter && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.totalExits)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totals.exitCount} movimentações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devoluções</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.totalReturns)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totals.returnCount} movimentações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totals.totalExits - totals.totalReturns)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saídas - Devoluções
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Movimentações do Centro de Custo
          </CardTitle>
          <CardDescription>
            {selectedCostCenter 
              ? `Detalhamento das movimentações do centro selecionado`
              : "Selecione um centro de custo para visualizar as movimentações"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(reportLoading || movementsLoading) ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterData(reportType === "movements" ? movementsData : reportData).map((movement: any) => {
                    const unitPrice = parseFloat(movement.unitPrice || '0');
                    const totalValue = movement.quantity * unitPrice;
                    
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={movement.displayType === 'Devolução' ? 'outline' : movement.type === 'entry' ? 'default' : 'secondary'}>
                            {movement.displayType || (movement.type === 'entry' ? 'Entrada' : 'Saída')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.material?.name || '-'}
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{formatCurrency(unitPrice)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(totalValue)}
                        </TableCell>
                        <TableCell>
                          {movement.costCenter ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{movement.costCenter.code}</span>
                              <span className="text-sm text-muted-foreground">{movement.costCenter.name}</span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {movement.employee?.name && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{movement.employee.name}</span>
                              </div>
                            )}
                            {movement.thirdParty?.name && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                <span>{movement.thirdParty.name}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {movement.notes || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(reportType === "movements" ? movementsData : reportData).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {selectedCostCenter 
                          ? "Nenhuma movimentação encontrada para o período selecionado"
                          : "Selecione um centro de custo para visualizar as movimentações"
                        }
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