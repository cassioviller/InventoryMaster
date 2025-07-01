import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Plus, X, Package, User, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

// Schema para devolução de funcionário
const returnItemSchema = z.object({
  materialId: z.number().min(1, 'Material é obrigatório'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que zero'),
  lotId: z.number().optional(), // Para materiais com múltiplos preços
  unitPrice: z.string(),
  condition: z.enum(['good', 'damaged', 'lost']).default('good'),
  reason: z.string().optional(),
});

const employeeReturnSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  employeeId: z.number().min(1, 'Funcionário é obrigatório'),
  items: z.array(returnItemSchema).min(1, 'Adicione pelo menos um material'),
  notes: z.string().optional(),
});

type EmployeeReturnForm = z.infer<typeof employeeReturnSchema>;
type ReturnItem = z.infer<typeof returnItemSchema>;

interface Material {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  unitPrice?: string;
}

interface Employee {
  id: number;
  name: string;
  department: string;
}

interface MaterialLot {
  id: number;
  materialId: number;
  unitPrice: string;
  currentStock: number;
  lastEntry?: string;
  supplierName?: string;
}

export default function EmployeeReturn() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialLots, setMaterialLots] = useState<MaterialLot[]>([]);
  const [showLotSelection, setShowLotSelection] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ReturnItem>>({
    condition: 'good',
    quantity: 1,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<EmployeeReturnForm>({
    resolver: zodResolver(employeeReturnSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      items: [],
    },
  });

  // Queries
  const { data: materials = [] } = useQuery({
    queryKey: ['/api/materials'],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Buscar lotes de um material
  const fetchMaterialLots = async (materialId: number): Promise<MaterialLot[]> => {
    const response = await apiRequest(`/api/materials/${materialId}/lots`);
    return response || [];
  };

  // Mutation para criar devolução
  const createReturnMutation = useMutation({
    mutationFn: async (data: EmployeeReturnForm) => {
      return apiRequest('/api/movements/employee-return', {
        method: 'POST',
        body: JSON.stringify({
          type: 'entry',
          date: data.date,
          originType: 'employee_return',
          returnEmployeeId: data.employeeId,
          isReturn: true,
          notes: data.notes,
          items: data.items.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            materialCondition: item.condition,
            returnReason: item.reason,
            ...(item.lotId && { lotId: item.lotId }),
          })),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] });
      toast({
        title: 'Devolução registrada',
        description: 'A devolução foi registrada com sucesso.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar devolução',
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });

  // Handlers
  const handleMaterialSelect = async (materialId: string) => {
    const material = materials.find((m: Material) => m.id === parseInt(materialId));
    if (!material) return;

    setSelectedMaterial(material);
    
    // Buscar lotes do material
    try {
      const lots = await fetchMaterialLots(material.id);
      setMaterialLots(lots);
      
      if (lots.length > 1) {
        setShowLotSelection(true);
        setCurrentItem({ ...currentItem, materialId: material.id, unitPrice: '' });
      } else if (lots.length === 1) {
        setShowLotSelection(false);
        setCurrentItem({
          ...currentItem,
          materialId: material.id,
          unitPrice: lots[0].unitPrice,
          lotId: lots[0].id,
        });
      } else {
        // Material sem lotes (não deveria acontecer para devoluções)
        setCurrentItem({
          ...currentItem,
          materialId: material.id,
          unitPrice: material.unitPrice || '0.00',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar lotes:', error);
      setCurrentItem({
        ...currentItem,
        materialId: material.id,
        unitPrice: material.unitPrice || '0.00',
      });
    }
  };

  const handleLotSelect = (lotId: string) => {
    const lot = materialLots.find(l => l.id === parseInt(lotId));
    if (lot) {
      setCurrentItem({
        ...currentItem,
        lotId: lot.id,
        unitPrice: lot.unitPrice,
      });
    }
  };

  const addItemToList = () => {
    if (!currentItem.materialId || !currentItem.quantity || !currentItem.unitPrice) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    const items = form.getValues('items');
    const newItem: ReturnItem = {
      materialId: currentItem.materialId,
      quantity: currentItem.quantity!,
      unitPrice: currentItem.unitPrice,
      condition: currentItem.condition || 'good',
      reason: currentItem.reason,
      ...(currentItem.lotId && { lotId: currentItem.lotId }),
    };

    form.setValue('items', [...items, newItem]);
    
    // Reset current item
    setCurrentItem({ condition: 'good', quantity: 1 });
    setSelectedMaterial(null);
    setMaterialLots([]);
    setShowLotSelection(false);
  };

  const removeItem = (index: number) => {
    const items = form.getValues('items');
    form.setValue('items', items.filter((_, i) => i !== index));
  };

  const onSubmit = (data: EmployeeReturnForm) => {
    createReturnMutation.mutate(data);
  };

  const items = form.watch('items') || [];
  const totalValue = items.reduce((total, item) => {
    return total + (item.quantity * parseFloat(item.unitPrice || '0'));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Devolução de Funcionário</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações da Devolução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Devolução</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário que está devolvendo</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(employees) && employees.map((employee: Employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.name} - {employee.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Informações adicionais sobre a devolução..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Adicionar Material */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Material</Label>
                  <Select onValueChange={handleMaterialSelect} value={selectedMaterial?.id.toString() || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o material" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(materials) && materials.map((material: Material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} - {material.unit} (Estoque: {material.currentStock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentItem.quantity || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                    placeholder="Quantidade a devolver"
                  />
                </div>
              </div>

              {/* Seleção de Lote (para múltiplos preços) */}
              {showLotSelection && materialLots.length > 1 && (
                <div>
                  <Label>Lote para Devolução *</Label>
                  <RadioGroup
                    value={currentItem.lotId?.toString()}
                    onValueChange={handleLotSelect}
                    className="mt-2"
                  >
                    {materialLots.map((lot, index) => (
                      <div key={lot.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={lot.id.toString()} id={`lot-${lot.id}`} />
                        <Label htmlFor={`lot-${lot.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">
                            Preço {index + 1} de {materialLots.length}: R$ {lot.unitPrice}
                          </div>
                          <div className="text-sm text-gray-600">
                            {lot.currentStock} unidades disponíveis
                            {lot.lastEntry && ` • Última entrada: ${lot.lastEntry}`}
                            {lot.supplierName && ` • ${lot.supplierName}`}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Valor Unitário (somente leitura) */}
              {currentItem.unitPrice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Unitário (R$)</Label>
                    <Input
                      value={`R$ ${currentItem.unitPrice}`}
                      readOnly
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {materialLots.length > 1 ? 'Baseado no lote selecionado' : 'Baseado no preço cadastrado'}
                    </p>
                  </div>

                  <div>
                    <Label>Valor Total</Label>
                    <Input
                      value={`R$ ${((currentItem.quantity || 0) * parseFloat(currentItem.unitPrice || '0')).toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Estado do Material */}
              <div>
                <Label>Estado do Material</Label>
                <RadioGroup
                  value={currentItem.condition}
                  onValueChange={(value: 'good' | 'damaged' | 'lost') => setCurrentItem({ ...currentItem, condition: value })}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="good" />
                    <Label htmlFor="good">Bom Estado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="damaged" id="damaged" />
                    <Label htmlFor="damaged">Danificado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lost" id="lost" />
                    <Label htmlFor="lost">Perdido/Não Localizado</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Motivo da Devolução */}
              <div>
                <Label>Motivo da Devolução (Opcional)</Label>
                <Textarea
                  value={currentItem.reason || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, reason: e.target.value })}
                  placeholder="Ex: Sobrou do projeto, material defeituoso, troca de especificação..."
                  rows={2}
                />
              </div>

              <Button type="button" onClick={addItemToList} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar à Lista
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Materiais Adicionados */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Materiais para Devolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const material = materials.find((m: Material) => m.id === item.materialId);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{material?.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} {material?.unit} × R$ {item.unitPrice} = R$ {(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Estado: {item.condition === 'good' ? 'Bom' : item.condition === 'damaged' ? 'Danificado' : 'Perdido'}
                            {item.reason && ` • ${item.reason}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total da Devolução:</span>
                    <span>R$ {totalValue.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Valor de referência - não representa custo adicional
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={items.length === 0 || createReturnMutation.isPending}
              className="flex-1"
            >
              {createReturnMutation.isPending ? 'Processando...' : 'Confirmar Devolução'}
            </Button>
            <Link href="/reports">
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}