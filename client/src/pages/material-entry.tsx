import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEntrySchema, type CreateEntry } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth-request';

interface MaterialItem {
  materialId: number;
  materialName: string;
  quantity: number;
  unitPrice: number;
  selectedLotPrice?: string; // Para devoluções com múltiplos lotes
}

interface ReturnLot {
  unitPrice: string;
  totalEntries: number;
  availableQuantity: number;
  entryDate: Date;
  supplierId: number | null;
  supplierName?: string;
  lastEntryDate: Date;
}

export default function MaterialEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addedItems, setAddedItems] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [availableReturnLots, setAvailableReturnLots] = useState<ReturnLot[]>([]);
  const [selectedReturnLot, setSelectedReturnLot] = useState('');
  const [isLoadingLots, setIsLoadingLots] = useState(false);

  const form = useForm<Omit<CreateEntry, 'items'>>({
    resolver: zodResolver(createEntrySchema.omit({ items: true })),
    defaultValues: {
      type: 'entry',
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
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const materials = materialsData || [];
  const suppliers = suppliersData || [];
  const employees = employeesData || [];
  const thirdParties = thirdPartiesData || [];

  const createEntryMutation = useMutation({
    mutationFn: async (data: CreateEntry) => {
      console.log("=== ENVIANDO ENTRADA ===");
      console.log("Data:", JSON.stringify(data, null, 2));
      
      const res = await authenticatedRequest('/api/movements/entry', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const result = await res.json();
      console.log("Success result:", result);
      return result;
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
      setUnitPrice('');
    },
    onError: (error) => {
      console.error("Entry mutation error:", error);
      toast({
        title: "Erro ao registrar entrada",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const originType = form.watch('originType');

  // Função para buscar lotes de devolução
  const fetchReturnLots = async (materialId: number) => {
    if (originType !== 'employee_return' && originType !== 'third_party_return') {
      return;
    }

    setIsLoadingLots(true);
    try {
      const res = await authenticatedRequest(`/api/materials/${materialId}/return-lots`);
      const lots = await res.json();
      setAvailableReturnLots(Array.isArray(lots) ? lots : []);
      
      // Se há apenas um lote, seleciona automaticamente
      if (lots.length === 1) {
        setSelectedReturnLot(lots[0].unitPrice);
        setUnitPrice(lots[0].unitPrice);
      } else {
        setSelectedReturnLot('');
        setUnitPrice('');
      }
    } catch (error) {
      console.error('Error fetching return lots:', error);
      setAvailableReturnLots([]);
      setSelectedReturnLot('');
      setUnitPrice('');
    } finally {
      setIsLoadingLots(false);
    }
  };

  // Handler para mudança de material
  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterial(materialId);
    setAvailableReturnLots([]);
    setSelectedReturnLot('');
    setUnitPrice('');
    
    if (materialId && (originType === 'employee_return' || originType === 'third_party_return')) {
      fetchReturnLots(parseInt(materialId));
    }
  };

  // Handler para mudança de lote de devolução
  const handleReturnLotChange = (lotPrice: string) => {
    setSelectedReturnLot(lotPrice);
    setUnitPrice(lotPrice);
  };

  const addMaterial = () => {
    if (!selectedMaterial || !quantity || parseInt(quantity) <= 0 || !unitPrice || parseFloat(unitPrice) <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Selecione um material e informe uma quantidade e valor unitário válidos.",
        variant: "destructive",
      });
      return;
    }

    // Validações específicas para devoluções
    if (originType === 'employee_return' || originType === 'third_party_return') {
      if (availableReturnLots.length === 0) {
        toast({
          title: "Material inválido para devolução",
          description: "Este material não possui lotes disponíveis para devolução.",
          variant: "destructive",
        });
        return;
      }

      if (availableReturnLots.length > 1 && !selectedReturnLot) {
        toast({
          title: "Selecione um lote",
          description: "Para materiais com múltiplos preços, selecione o lote para devolução.",
          variant: "destructive",
        });
        return;
      }

      // Validar quantidade contra o lote selecionado
      const targetLot = availableReturnLots.length === 1 
        ? availableReturnLots[0] 
        : availableReturnLots.find(lot => lot.unitPrice === selectedReturnLot);
      
      if (targetLot && parseInt(quantity) > targetLot.availableQuantity) {
        toast({
          title: "Quantidade excede lote",
          description: `Disponível no lote R$ ${targetLot.unitPrice}: ${targetLot.availableQuantity} unidades.`,
          variant: "destructive",
        });
        return;
      }
    }

    const material = materials?.find((m: any) => m.id === parseInt(selectedMaterial));
    if (!material) return;

    const existingItemIndex = addedItems.findIndex(item => 
      item.materialId === parseInt(selectedMaterial) && 
      item.selectedLotPrice === selectedReturnLot
    );
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...addedItems];
      updatedItems[existingItemIndex].quantity += parseInt(quantity);
      updatedItems[existingItemIndex].unitPrice = parseFloat(unitPrice);
      setAddedItems(updatedItems);
    } else {
      const newItem: MaterialItem = {
        materialId: parseInt(selectedMaterial),
        materialName: material.name,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
      };

      // Adicionar informação do lote para devoluções
      if (originType === 'employee_return' || originType === 'third_party_return') {
        newItem.selectedLotPrice = selectedReturnLot || availableReturnLots[0]?.unitPrice;
      }

      setAddedItems([...addedItems, newItem]);
    }

    // Limpar campos
    setSelectedMaterial('');
    setQuantity('');
    setUnitPrice('');
    setAvailableReturnLots([]);
    setSelectedReturnLot('');

    // Feedback específico por tipo
    const action = originType === 'employee_return' || originType === 'third_party_return' 
      ? 'devolução adicionada' 
      : 'material adicionado';
    
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)}`,
      description: `${material.name} - ${quantity} unidades`,
    });
  };

  const removeItem = (index: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== index));
  };

  const onSubmit = (data: Omit<CreateEntry, 'items'>) => {
    console.log("=== BOTÃO CONFIRMAR ENTRADA CLICADO ===");
    console.log("Form data received:", data);
    console.log("Added items:", addedItems);
    
    if (addedItems.length === 0) {
      console.log("ERROR: No items added");
      toast({
        title: "Nenhum material adicionado",
        description: "Adicione pelo menos um material antes de confirmar a entrada.",
        variant: "destructive",
      });
      return;
    }

    const entryData: CreateEntry = {
      ...data,
      type: "entry",
      items: addedItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      })),
    };

    console.log("Final entry data:", entryData);
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
            {/* Hidden type field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <input type="hidden" {...field} value="entry" />
              )}
            />
            
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
              
              {/* Material Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
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

              {/* Lotes de Devolução - mostrar apenas para devoluções */}
              {(originType === 'employee_return' || originType === 'third_party_return') && selectedMaterial && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {isLoadingLots ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Carregando lotes disponíveis...</span>
                    </div>
                  ) : availableReturnLots.length === 0 ? (
                    <div className="text-sm text-red-600">
                      ⚠️ Este material não possui lotes disponíveis para devolução.
                    </div>
                  ) : availableReturnLots.length === 1 ? (
                    <div className="text-sm text-green-700">
                      ✅ <strong>Lote único detectado:</strong> R$ {availableReturnLots[0].unitPrice} 
                      {availableReturnLots[0].supplierName && ` (${availableReturnLots[0].supplierName})`}
                      <br />
                      <span className="text-xs text-gray-600">
                        Disponível: {availableReturnLots[0].availableQuantity} unidades
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lote para Devolução *
                      </label>
                      <div className="space-y-2">
                        {availableReturnLots.map((lot, index) => (
                          <label key={lot.unitPrice} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="returnLot"
                              value={lot.unitPrice}
                              checked={selectedReturnLot === lot.unitPrice}
                              onChange={(e) => handleReturnLotChange(e.target.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                Preço {index + 1} de {availableReturnLots.length}: R$ {lot.unitPrice}
                                <span className="text-gray-600"> ({lot.availableQuantity} unidades disponíveis)</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Última entrada: {new Date(lot.lastEntryDate).toLocaleDateString('pt-BR')}
                                {lot.supplierName && ` - ${lot.supplierName}`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Unitário (R$)
                    {(originType === 'employee_return' || originType === 'third_party_return') && availableReturnLots.length > 0 && (
                      <span className="text-xs text-gray-500 ml-1">(baseado no lote selecionado)</span>
                    )}
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    readOnly={(originType === 'employee_return' || originType === 'third_party_return') && availableReturnLots.length > 0}
                    className={(originType === 'employee_return' || originType === 'third_party_return') && availableReturnLots.length > 0 ? 'bg-gray-100' : ''}
                  />
                  {(originType === 'employee_return' || originType === 'third_party_return') && availableReturnLots.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      ℹ️ Valor baseado no lote cadastrado do material
                    </p>
                  )}
                </div>
              </div>
              
              {quantity && unitPrice && parseFloat(unitPrice) > 0 && parseInt(quantity) > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    Valor Total: <span className="text-green-600">R$ {(parseInt(quantity) * parseFloat(unitPrice)).toFixed(2).replace('.', ',')}</span>
                    {(originType === 'employee_return' || originType === 'third_party_return') && (
                      <span className="text-xs text-gray-500 ml-2">(valor de referência)</span>
                    )}
                  </div>
                </div>
              )}
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
                            {item.selectedLotPrice && (
                              <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                                Lote R$ {item.selectedLotPrice}
                              </Badge>
                            )}
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
                      <span className="text-lg font-semibold text-gray-900">
                        {(originType === 'employee_return' || originType === 'third_party_return') 
                          ? 'Total da Devolução:' 
                          : 'Total Geral:'
                        }
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {addedItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0).toFixed(2)}
                        {(originType === 'employee_return' || originType === 'third_party_return') && (
                          <span className="text-sm text-gray-500 ml-2">(valor de referência)</span>
                        )}
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
                onClick={(e) => {
                  console.log("=== BOTÃO CLICADO DIRETAMENTE ===");
                  console.log("Event:", e);
                  console.log("Form errors:", form.formState.errors);
                  console.log("Form data:", form.getValues());
                  console.log("Added items:", addedItems);
                }}
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
