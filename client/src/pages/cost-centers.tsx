import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, Edit, Trash2, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CostCenter {
  id: number;
  code: string;
  name: string;
  description?: string;
  department: string;
  responsible: string;
  monthlyBudget?: string;
  annualBudget?: string;
  isActive: boolean;
  createdAt: string;
}

interface CostCenterFormData {
  code: string;
  name: string;
  description?: string;
  department: string;
  responsible: string;
  monthlyBudget?: string;
  annualBudget?: string;
  isActive: boolean;
}

const departments = [
  "Manutenção",
  "Produção",
  "Administração",
  "Vendas",
  "Compras",
  "Logística",
  "Recursos Humanos",
  "Financeiro",
  "TI",
  "Qualidade"
];

export default function CostCentersPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Form state
  const [formData, setFormData] = useState<CostCenterFormData>({
    code: "",
    name: "",
    description: "",
    department: "",
    responsible: "",
    monthlyBudget: "",
    annualBudget: "",
    isActive: true
  });

  // Fetch cost centers
  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ["/api/cost-centers"],
  });

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: async (data: CostCenterFormData) => {
      const method = editingCenter ? "PUT" : "POST";
      const url = editingCenter ? `/api/cost-centers/${editingCenter.id}` : "/api/cost-centers";
      if (method === "POST") {
        return apiRequest(url, JSON.stringify(data));
      } else {
        return apiRequest(url, JSON.stringify(data));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centers"] });
      toast({
        title: editingCenter ? "Centro atualizado" : "Centro criado",
        description: editingCenter ? "Centro de custo atualizado com sucesso!" : "Centro de custo criado com sucesso!",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar centro de custo",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cost-centers/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centers"] });
      toast({
        title: "Centro removido",
        description: "Centro de custo removido com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover centro de custo",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      department: "",
      responsible: "",
      monthlyBudget: "",
      annualBudget: "",
      isActive: true
    });
    setEditingCenter(null);
    setIsModalOpen(false);
  };

  const handleEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setFormData({
      code: center.code,
      name: center.name,
      description: center.description || "",
      department: center.department,
      responsible: center.responsible,
      monthlyBudget: center.monthlyBudget || "",
      annualBudget: center.annualBudget || "",
      isActive: center.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.department || !formData.responsible) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha código, nome, departamento e responsável",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  // Filter cost centers
  const filteredCenters = (costCenters as CostCenter[]).filter((center) => {
    const matchesSearch = 
      center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && center.isActive) ||
      (statusFilter === "inactive" && !center.isActive);
    
    const matchesDepartment = departmentFilter === "all" || center.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const formatCurrency = (value?: string) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando centros de custo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Centros de Custo</h1>
            <p className="text-gray-600">Gerenciar centros de custo para controle financeiro</p>
          </div>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Centro
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}
              </DialogTitle>
              <DialogDescription>
                {editingCenter ? "Edite as informações do centro de custo" : "Preencha os dados para criar um novo centro de custo"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: (e.target.value || '').toUpperCase() })}
                    placeholder="Ex: MANUT001"
                    className="uppercase"
                    maxLength={20}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do centro de custo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do centro de custo"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável *</Label>
                  <Input
                    id="responsible"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyBudget">Orçamento Mensal (R$)</Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="annualBudget">Orçamento Anual (R$)</Label>
                  <Input
                    id="annualBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annualBudget}
                    onChange={(e) => setFormData({ ...formData, annualBudget: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Centro ativo</Label>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : editingCenter ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Código, nome, departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredCenters.length} de {costCenters.length} centros de custo
        </p>
      </div>

      {/* Cost Centers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Orç. Mensal</TableHead>
                <TableHead>Orç. Anual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== "all" || departmentFilter !== "all" 
                      ? "Nenhum centro encontrado com os filtros aplicados"
                      : "Nenhum centro de custo cadastrado"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredCenters.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{center.name}</div>
                        {center.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {center.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{center.department}</TableCell>
                    <TableCell>{center.responsible}</TableCell>
                    <TableCell>{formatCurrency(center.monthlyBudget)}</TableCell>
                    <TableCell>{formatCurrency(center.annualBudget)}</TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"}>
                        {center.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(center)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este centro de custo?")) {
                              deleteMutation.mutate(center.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to cost center report
                            window.location.href = `/cost-center-reports?center=${center.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}