import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEntrySchema, type CreateEntryData } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';

interface MaterialItem {
  materialId: number;
  materialName: string;
  quantity: number;
  unitPrice: number;
}

export default function MaterialEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addedItems, setAddedItems] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const form = useForm<Omit<CreateEntryData, 'items'>>({
    resolver: zodResolver(createEntrySchema.omit({ items: true })),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      originType: 'supplier',
    },
  });

  const { data: materialsData } = useQuery({
    queryKey: ['/api/materials'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/materials');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['/api/suppliers?active=true'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/suppliers?active=true');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/employees');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: thirdPartiesData } = useQuery({
    queryKey: ['/api/third-parties'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/third-parties');
      return res.json();
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees?active=true'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/employees?active=true');
      return res.json();
    },
  });

  const { data: thirdParties } = useQuery({
    queryKey: ['/api/third-parties?active=true'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/third-parties?active=true');
      return res.json();
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: CreateEntryData) => {
      const res = await authenticatedRequest('/api/movements/entry', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Entrada registrada com sucesso!",
        description: "Os materiais foram adicionados ao estoque.",
      });
      form.reset();
      setAddedItems([]);
      setSelectedMaterial('');
      setQuantity('');
    },
    onError: () => {
      toast({
        title: "Erro ao registrar entrada",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const originType = form.watch('originType');

  const addMaterial = () => {
    if (!selectedMaterial || !quantity || parseInt(quantity) <= 0 || !unitPrice || parseFloat(unitPrice) <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Selecione um material e informe uma quantidade e valor unitário válidos.",
        variant: "destructive",
      });
      return;
    }

    const material = materials?.find((m: any) => m.id === parseInt(selectedMaterial));
    if (!material) return;

    const existingItemIndex = addedItems.findIndex(item => item.materialId === parseInt(selectedMaterial));
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...addedItems];
      updatedItems[existingItemIndex].quantity += parseInt(quantity);
      // Atualiza o preço unitário para o mais recente
      updatedItems[existingItemIndex].unitPrice = parseFloat(unitPrice);
      setAddedItems(updatedItems);
    } else {
      setAddedItems([...addedItems, {
        materialId: parseInt(selectedMaterial),
        materialName: material.name,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
      }]);
    }

    setSelectedMaterial('');
    setQuantity('');
    setUnitPrice('');
  };

  const removeItem = (index: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== index));
  };

  const onSubmit = (data: Omit<CreateEntryData, 'items'>) => {
    if (addedItems.length === 0) {
      toast({
        title: "Nenhum material adicionado",
        description: "Adicione pelo menos um material antes de confirmar a entrada.",
        variant: "destructive",
      });
      return;
    }

    const entryData: CreateEntryData = {
      ...data,
      items: addedItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    createEntryMutation.mutate(entryData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Entrada de Material</CardTitle>
            <p className="text-sm text-gray-600">Adicione múltiplos materiais em uma única entrada</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date and Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="originType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="supplier">Fornecedor</SelectItem>
                        <SelectItem value="employee_return">Devolução de Funcionário</SelectItem>
                        <SelectItem value="third_party_return">Devolução de Terceiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional Origin Selection */}
            {originType === 'supplier' && (
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {originType === 'employee_return' && (
              <FormField
                control={form.control}
                name="returnEmployeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um funcionário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((employee: any) => (
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
            )}

            {originType === 'third_party_return' && (
              <FormField
                control={form.control}
                name="returnThirdPartyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terceiro *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um terceiro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {thirdParties?.map((thirdParty: any) => (
                          <SelectItem key={thirdParty.id} value={thirdParty.id.toString()}>
                            {thirdParty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Material Selection */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Materiais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((material: any) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor Unitário (R$)</label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button type="button" onClick={addMaterial} className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar à Lista
                </Button>
              </div>
            </div>

            {/* Materials List */}
            {addedItems.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Materiais Adicionados</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {addedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{item.materialName}</span>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">
                              Qtd: {item.quantity}
                            </Badge>
                            <Badge variant="outline">
                              R$ {item.unitPrice.toFixed(2)}/un
                            </Badge>
                            <Badge variant="default">
                              Total: R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {/* Total Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Geral:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {addedItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                className="bg-green-500 hover:bg-green-600"
                disabled={createEntryMutation.isPending || addedItems.length === 0}
              >
                {createEntryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Entrada
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
