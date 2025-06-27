import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertSupplierSchema, type InsertSupplier, type Supplier } from '@shared/schema';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth-request';

interface SupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onClose: () => void;
}

export function SupplierModal({ open, onOpenChange, supplier, onClose }: SupplierModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await authenticatedRequest('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Fornecedor criado com sucesso!",
        description: "O fornecedor foi adicionado ao sistema.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro ao criar fornecedor",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await authenticatedRequest(`/api/suppliers/${supplier?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Fornecedor atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        cnpj: supplier.cnpj || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive,
      });
    } else {
      form.reset({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        isActive: true,
      });
    }
  }, [supplier, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: InsertSupplier) => {
    if (supplier) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@fornecedor.com" {...field} value={field.value || ''} />
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
                    <Input placeholder="(11) 99999-9999" {...field} value={field.value || ''} />
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
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações / Materiais Fornecidos</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os materiais e serviços fornecidos por este fornecedor..."
                      rows={4}
                      {...field}
                      value={field.value || ''}
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
                {supplier ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
