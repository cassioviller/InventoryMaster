import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Movement {
  id: number;
  type: 'entry' | 'exit';
  date: string;
  quantity: number;
  unitPrice: string;
  notes?: string;
  createdAt: string;
  material: {
    id: number;
    name: string;
    unit: string;
  };
  supplier?: {
    id: number;
    name: string;
  };
  employee?: {
    id: number;
    name: string;
  };
  thirdParty?: {
    id: number;
    name: string;
  };
  costCenter?: {
    id: number;
    code: string;
    name: string;
  };
}

export default function MovementsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch movements
  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/reports/general-movements'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Fetch materials for filter
  const { data: materials = [] } = useQuery({
    queryKey: ['/api/materials'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Delete movement mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: number) => {
      const response = await fetch(`/api/movements/${movementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete movement');
      }
      return response.status === 204 ? { success: true } : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/general-movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: "Movimentação excluída com sucesso. Estoque recalculado automaticamente.",
        variant: "default"
      });
      setShowDeleteDialog(false);
      setSelectedMovement(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir movimentação",
        variant: "destructive"
      });
    }
  });

  // Recalculate all stocks mutation
  const recalculateStocksMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/materials/recalculate-all-stocks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to recalculate stocks');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: "Todos os estoques foram recalculados com sucesso.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao recalcular estoques",
        variant: "destructive"
      });
    }
  });

  // Filter movements
  const filteredMovements = movements.filter((movement: Movement) => {
    const matchesSearch = movement.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || movement.type === typeFilter;
    const matchesMaterial = materialFilter === "all" || movement.material?.id.toString() === materialFilter;
    
    return matchesSearch && matchesType && matchesMaterial;
  });

  const handleDeleteMovement = (movement: Movement) => {
    setSelectedMovement(movement);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedMovement) {
      deleteMovementMutation.mutate(selectedMovement.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Movimentações</h1>
          <p className="text-gray-600">Visualize, edite e exclua movimentações de estoque</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => recalculateStocksMutation.mutate()}
            disabled={recalculateStocksMutation.isPending}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${recalculateStocksMutation.isPending ? 'animate-spin' : ''}`} />
            Recalcular Estoques
          </Button>
        </div>
      </div>

      {/* Alert about stock integrity */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Importante - Integridade do Estoque
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Ao excluir movimentações, o estoque será automaticamente recalculado. 
            Use a função "Recalcular Estoques" se houver inconsistências após manipulações diretas no banco de dados.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Material, notas, fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="entry">Entradas</SelectItem>
                  <SelectItem value="exit">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Material</label>
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os materiais</SelectItem>
                  {materials.map((material: any) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Movimentações 
            <Badge variant="secondary" className="ml-2">
              {filteredMovements.length} resultados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="text-center py-8">Carregando movimentações...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMovements.map((movement: Movement) => (
                <div key={movement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                    <div>
                      <div className="font-medium">#{movement.id}</div>
                      <Badge variant={movement.type === 'entry' ? 'default' : 'secondary'}>
                        {movement.type === 'entry' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="font-medium">{movement.material?.name}</div>
                      <div className="text-sm text-gray-600">
                        {movement.quantity} {movement.material?.unit}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">Preço Unitário</div>
                      <div className="font-medium">
                        {formatCurrency(movement.unitPrice || 0)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">Valor Total</div>
                      <div className="font-medium">
                        {formatCurrency((movement.quantity || 0) * parseFloat(movement.unitPrice || '0'))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">Data</div>
                      <div className="text-sm">
                        {formatDate(movement.date)}
                      </div>
                      {movement.supplier && (
                        <div className="text-xs text-gray-500 mt-1">
                          {movement.supplier.name}
                        </div>
                      )}
                      {movement.employee && (
                        <div className="text-xs text-gray-500 mt-1">
                          {movement.employee.name}
                        </div>
                      )}
                      {movement.costCenter && (
                        <div className="text-xs text-gray-500 mt-1">
                          {movement.costCenter.code}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMovement(movement)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {movement.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600">
                        <strong>Observações:</strong> {movement.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta movimentação?
              <br />
              <br />
              <strong>Material:</strong> {selectedMovement?.material?.name}
              <br />
              <strong>Tipo:</strong> {selectedMovement?.type === 'entry' ? 'Entrada' : 'Saída'}
              <br />
              <strong>Quantidade:</strong> {selectedMovement?.quantity} {selectedMovement?.material?.unit}
              <br />
              <br />
              ⚠️ O estoque será automaticamente recalculado após a exclusão.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMovementMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMovementMutation.isPending}
            >
              {deleteMovementMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}