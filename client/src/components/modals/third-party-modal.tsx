import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertThirdPartySchema, type InsertThirdParty, type ThirdParty } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';

interface ThirdPartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thirdParty?: ThirdParty | null;
  onClose: () => void;
}

export function ThirdPartyModal({ open, onOpenChange, thirdParty, onClose }: ThirdPartyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertThirdParty>({
    resolver: zodResolver(insertThirdPartySchema),
    defaultValues: {
      name: '',
      document: '',
      documentType: 'CPF',
      email: '',
      phone: '',
      address: '',
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertThirdParty) => {
      const res = await authenticatedRequest('/api/third-parties', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/third-parties'] });
      toast({
        title: "Terceiro criado com sucesso!",
        description: "O terceiro foi adicionado ao sistema.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro ao criar terceiro",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertThirdParty) => {
      const res = await authenticatedRequest(`/api/third-parties/${thirdParty?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/third-parties'] });
      toast({
        title: "Terceiro atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar terceiro",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (thirdParty) {
      form.reset({
        name: thirdParty.name,
        document: thirdParty.document || '',
        documentType: thirdParty.documentType || 'CPF',
        email: thirdParty.email || '',
        phone: thirdParty.phone || '',
        address: thirdParty.address || '',
        isActive: thirdParty.isActive,
      });
    } else {
      form.reset({
        name: '',
        document: '',
        documentType: 'CPF',
        email: '',
        phone: '',
        address: '',
        isActive: true,
      });
    }
  }, [thirdParty, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: InsertThirdParty) => {
    if (thirdParty) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {thirdParty ? 'Editar Terceiro' : 'Novo Terceiro'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo ou razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CPF">CPF</SelectItem>
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou CNPJ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Endereço completo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {thirdParty ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
