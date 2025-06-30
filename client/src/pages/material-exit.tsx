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
}

export default function MaterialExit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addedItems, setAddedItems] = useState<MaterialExitItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purpose, setPurpose] = useState('');

  const form = useForm<Omit<CreateExit, 'items'>>({
    resolver: zodResolver(createExitSchema.omit({ items: true })),
    defaultValues: {
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

  const materials = materialsData || [];
  const employees = employeesData || [];
  const thirdParties = thirdPartiesData || [];

  const createExitMutation = useMutation({
    mutationFn: async (data: CreateExitData) => {
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

    if (material.currentStock < parseInt(quantity)) {
      toast({
        title: "Estoque insuficiente",
        description: `Estoque disponível: ${material.currentStock}`,
        variant: "destructive",
      });
      return;
    }

    const existingItemIndex = addedItems.findIndex(item => item.materialId === parseInt(selectedMaterial));
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...addedItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + parseInt(quantity);
      
      if (material.currentStock < newQuantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Estoque disponível: ${material.currentStock}`,
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
        quantity: parseInt(quantity),
        purpose: purpose || undefined,
      }]);
    }

    setSelectedMaterial('');
    setQuantity('');
    setPurpose('');
  };

  const removeItem = (index: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== index));
  };

  const onSubmit = (data: Omit<CreateExitData, 'items'>) => {
    if (addedItems.length === 0) {
      toast({
        title: "Nenhum material adicionado",
        description: "Adicione pelo menos um material antes de confirmar a saída.",
        variant: "destructive",
      });
      return;
    }

    const exitData: CreateExitData = {
      ...data,
      items: addedItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        purpose: item.purpose,
      })),
    };

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
                    onChange={(e) => setQuantity(e.target.value)}
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
