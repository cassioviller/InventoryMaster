import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExitSchema, type CreateExit } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth-request';

interface MaterialExitItem {
  materialId: number;
  materialName: string;
  quantity: number;
  purpose?: string;
  preferredLotPrice?: string; // Para indicar se o usuário selecionou um lote específico
}

interface MaterialLot {
  unitPrice: string;
  totalEntries: number;
  availableQuantity: number;
  entryDate: string;
  supplierId: number | null;
}

interface FifoSimulation {
  lots: Array<{ unitPrice: string; quantity: number; }>;
  totalValue: number;
}

export default function MaterialExit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addedItems, setAddedItems] = useState<MaterialExitItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedMaterialLots, setSelectedMaterialLots] = useState<MaterialLot[]>([]);
  const [fifoSimulation, setFifoSimulation] = useState<FifoSimulation | null>(null);
  const [selectedLotPrice, setSelectedLotPrice] = useState<string>('');

  const form = useForm<Omit<CreateExit, 'items'>>({
    resolver: zodResolver(createExitSchema.omit({ items: true })),
    defaultValues: {
      type: 'exit',
      date: new Date().toISOString().split('T')[0],
      destinationType: 'employee',
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

  const { data: employeesData } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/employees');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: thirdPartiesData } = useQuery({
    queryKey: ['/api/third-parties?active=true'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/third-parties?active=true');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: costCentersData } = useQuery({
    queryKey: ['/api/cost-centers'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/cost-centers');
      const data = await res.json();
      return Array.isArray(data) ? data.filter(center => center.isActive) : [];
    },
  });

  const materials = materialsData || [];
  const employees = employeesData || [];
  const thirdParties = thirdPartiesData || [];

  const createExitMutation = useMutation({
    mutationFn: async (data: CreateExit) => {
      const res = await authenticatedRequest('/api/movements/exit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Saída registrada com sucesso!",
        description: "Os materiais foram retirados do estoque.",
      });
      form.reset();
      setAddedItems([]);
      setSelectedMaterial('');
      setQuantity('');
      setPurpose('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar saída",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const destinationType = form.watch('destinationType');

  // Fetch material lots when material is selected
  const fetchMaterialLots = async (materialId: number) => {
    try {
      const res = await authenticatedRequest(`/api/materials/${materialId}/lots`);
      const lots = await res.json();
      setSelectedMaterialLots(Array.isArray(lots) ? lots : []);
    } catch (error) {
      console.error('Error fetching material lots:', error);
      setSelectedMaterialLots([]);
    }
  };

  // Simulate FIFO exit when quantity changes
  const simulateFifoExit = async (materialId: number, quantity: number) => {
    try {
      const res = await authenticatedRequest(`/api/materials/${materialId}/simulate-exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const simulation = await res.json();
      setFifoSimulation(simulation);
    } catch (error) {
      console.error('Error simulating FIFO exit:', error);
      setFifoSimulation(null);
    }
  };

  // Handle material selection
  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterial(materialId);
    setFifoSimulation(null);
    setSelectedLotPrice('');
    if (materialId) {
      fetchMaterialLots(parseInt(materialId));
    } else {
      setSelectedMaterialLots([]);
    }
  };

  // Handle lot selection
  const handleLotSelection = (lotPrice: string) => {
    setSelectedLotPrice(lotPrice);
    setFifoSimulation(null);
    
    // If we have a quantity and a selected lot, calculate the value for this specific lot
    if (quantity && parseInt(quantity) > 0) {
      const selectedLot = selectedMaterialLots.find(lot => lot.unitPrice === lotPrice);
      if (selectedLot) {
        const requestedQty = parseInt(quantity);
        const availableQty = selectedLot.availableQuantity;
        const finalQty = Math.min(requestedQty, availableQty);
        
        setFifoSimulation({
          lots: [{ unitPrice: lotPrice, quantity: finalQty }],
          totalValue: parseFloat(lotPrice) * finalQty
        });
      }
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity: string) => {
    setQuantity(newQuantity);
    
    if (selectedMaterial && newQuantity && parseInt(newQuantity) > 0) {
      // If user has selected a specific lot, calculate for that lot only
      if (selectedLotPrice) {
        const selectedLot = selectedMaterialLots.find(lot => lot.unitPrice === selectedLotPrice);
        if (selectedLot) {
          const requestedQty = parseInt(newQuantity);
          const availableQty = selectedLot.availableQuantity;
          const finalQty = Math.min(requestedQty, availableQty);
          
          setFifoSimulation({
            lots: [{ unitPrice: selectedLotPrice, quantity: finalQty }],
            totalValue: parseFloat(selectedLotPrice) * finalQty
          });
        }
      } else {
        // Otherwise, use FIFO simulation
        simulateFifoExit(parseInt(selectedMaterial), parseInt(newQuantity));
      }
    } else {
      setFifoSimulation(null);
    }
  };

  const addMaterial = () => {
    if (!selectedMaterial || !quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Selecione um material e informe uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    const material = materials?.find((m: any) => m.id === parseInt(selectedMaterial));
    if (!material) return;

    const requestedQty = parseInt(quantity);

    // If user selected a specific lot, validate against that lot's available quantity
    if (selectedLotPrice) {
      const selectedLot = selectedMaterialLots.find(lot => lot.unitPrice === selectedLotPrice);
      if (!selectedLot) {
        toast({
          title: "Erro no lote",
          description: "Lote selecionado não encontrado",
          variant: "destructive",
        });
        return;
      }
      
      if (requestedQty > selectedLot.availableQuantity) {
        toast({
          title: "Estoque insuficiente no lote",
          description: `Disponível no lote R$ ${selectedLotPrice}: ${selectedLot.availableQuantity}`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validate against total stock if no specific lot selected
      if (material.currentStock < requestedQty) {
        toast({
          title: "Estoque insuficiente",
          description: `Estoque disponível: ${material.currentStock}`,
          variant: "destructive",
        });
        return;
      }
    }

    const existingItemIndex = addedItems.findIndex(item => item.materialId === parseInt(selectedMaterial));
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...addedItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + requestedQty;
      
      // Re-validate combined quantity
      const stockLimit = selectedLotPrice 
        ? selectedMaterialLots.find(lot => lot.unitPrice === selectedLotPrice)?.availableQuantity || 0
        : material.currentStock;
        
      if (newQuantity > stockLimit) {
        toast({
          title: "Estoque insuficiente",
          description: selectedLotPrice 
            ? `Disponível no lote R$ ${selectedLotPrice}: ${stockLimit}`
            : `Estoque disponível: ${stockLimit}`,
          variant: "destructive",
        });
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      if (purpose) updatedItems[existingItemIndex].purpose = purpose;
      setAddedItems(updatedItems);
    } else {
      setAddedItems([...addedItems, {
        materialId: parseInt(selectedMaterial),
        materialName: material.name,
        quantity: requestedQty,
        purpose: purpose || undefined,
        preferredLotPrice: selectedLotPrice || undefined,
      }]);
    }

    // Clear form and show success message
    setSelectedMaterial('');
    setQuantity('');
    setPurpose('');
    setSelectedMaterialLots([]);
    setSelectedLotPrice('');
    setFifoSimulation(null);
    
    toast({
      title: "Material adicionado",
      description: selectedLotPrice 
        ? `${material.name} (lote R$ ${selectedLotPrice}) - ${requestedQty} unidades`
        : `${material.name} (FIFO automático) - ${requestedQty} unidades`,
    });
  };

  const removeItem = (index: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== index));
  };

  const onSubmit = (data: Omit<CreateExit, 'items'>) => {
    console.log("=== BOTÃO CONFIRMAR SAÍDA CLICADO ===");
    console.log("Form data received:", data);
    console.log("Added items:", addedItems);
    
    if (addedItems.length === 0) {
      console.log("ERROR: No items added");
      toast({
        title: "Nenhum material adicionado",
        description: "Adicione pelo menos um material antes de confirmar a saída.",
        variant: "destructive",
      });
      return;
    }

    const exitData: CreateExit = {
      ...data,
      type: "exit",
      items: addedItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: "0",
      })),
    };

    console.log("Final exit data:", exitData);
    createExitMutation.mutate(exitData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Saída de Material</CardTitle>
            <p className="text-sm text-gray-600">Registre a saída de múltiplos materiais em uma única operação</p>
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
                <input type="hidden" {...field} value="exit" />
              )}
            />
            
            {/* Date and Destination */}
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
                name="destinationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Funcionário</SelectItem>
                        <SelectItem value="third_party">Terceiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional Destination Selection */}
            {destinationType === 'employee' && (
              <FormField
                control={form.control}
                name="destinationEmployeeId"
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

            {destinationType === 'third_party' && (
              <FormField
                control={form.control}
                name="destinationThirdPartyId"
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

            {/* Cost Center Selection */}
            <FormField
              control={form.control}
              name="costCenterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um centro de custo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {costCentersData?.map((costCenter: any) => (
                        <SelectItem key={costCenter.id} value={costCenter.id.toString()}>
                          {costCenter.code} - {costCenter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material Selection */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Materiais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                  <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((material: any) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} (Estoque: {material.currentStock})
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
                    onChange={(e) => handleQuantityChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finalidade</label>
                  <Input
                    placeholder="Para que será usado..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
              </div>

              {/* Material Lots Display */}
              {selectedMaterial && selectedMaterialLots.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    Lotes Disponíveis 
                    <span className="text-xs text-blue-600 ml-2">(clique para selecionar um lote específico)</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedMaterialLots.map((lot, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleLotSelection(lot.unitPrice)}
                        className={`flex justify-between items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          selectedLotPrice === lot.unitPrice
                            ? 'bg-blue-100 border-blue-500 shadow-md'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="text-sm">
                          <span className="font-medium">Preço: R$ {lot.unitPrice}</span>
                          <span className="text-gray-600 ml-3">Disponível: {lot.availableQuantity}</span>
                          {selectedLotPrice === lot.unitPrice && (
                            <span className="ml-3 text-blue-600 font-medium">✓ Selecionado</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(lot.entryDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedLotPrice && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => setSelectedLotPrice('')}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Limpar seleção (usar FIFO automático)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FIFO Simulation Display */}
              {fifoSimulation && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-3">Simulação FIFO - Como será processada a saída</h4>
                  <div className="space-y-2">
                    {fifoSimulation.lots.map((lot, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                        <div className="text-sm">
                          <span className="font-medium">R$ {lot.unitPrice}</span>
                          <span className="text-gray-600 ml-3">× {lot.quantity} unidades</span>
                        </div>
                        <div className="text-sm font-medium">
                          R$ {(parseFloat(lot.unitPrice) * lot.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-medium">
                        <span>Valor Total:</span>
                        <span className="text-green-700">R$ {fifoSimulation.totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button type="button" onClick={addMaterial} className="bg-red-500 hover:bg-red-600">
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
                        <div>
                          <span className="font-medium text-gray-900">{item.materialName}</span>
                          <Badge variant="secondary" className="ml-2">
                            Quantidade: {item.quantity}
                          </Badge>
                          {item.preferredLotPrice && (
                            <Badge variant="outline" className="ml-2 border-blue-500 text-blue-700">
                              Lote R$ {item.preferredLotPrice}
                            </Badge>
                          )}
                          {!item.preferredLotPrice && (
                            <Badge variant="outline" className="ml-2 border-green-500 text-green-700">
                              FIFO Automático
                            </Badge>
                          )}
                          {item.purpose && (
                            <p className="text-sm text-gray-600 mt-1">Finalidade: {item.purpose}</p>
                          )}
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
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                className="bg-red-500 hover:bg-red-600"
                disabled={createExitMutation.isPending || addedItems.length === 0}
              >
                {createExitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Saída
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
