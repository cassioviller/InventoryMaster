import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCostCenterSchema, type InsertCostCenter, type CostCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CostCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertCostCenter) => void;
  costCenter?: CostCenter;
  isLoading?: boolean;
}

export function CostCenterModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  costCenter, 
  isLoading = false 
}: CostCenterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertCostCenter>({
    resolver: zodResolver(insertCostCenterSchema),
    defaultValues: {
      code: "",
      name: "",
      department: "",
      responsible: "",
      monthlyBudget: "",
      annualBudget: "",
    },
  });

  useEffect(() => {
    if (costCenter) {
      form.reset({
        code: costCenter.code,
        name: costCenter.name,
        department: costCenter.department,
        responsible: costCenter.responsible,
        monthlyBudget: costCenter.monthlyBudget || "",
        annualBudget: costCenter.annualBudget || "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        department: "",
        responsible: "",
        monthlyBudget: "",
        annualBudget: "",
      });
    }
  }, [costCenter, form]);

  const handleSubmit = async (data: InsertCostCenter) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar centro de custo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {costCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}
          </DialogTitle>
          <DialogDescription>
            {costCenter 
              ? "Atualize as informações do centro de custo." 
              : "Preencha os dados para criar um novo centro de custo."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CC001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Administração" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Recursos Humanos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento Mensal</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annualBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento Anual</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Salvando..." : costCenter ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}