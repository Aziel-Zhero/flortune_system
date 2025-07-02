// src/app/(app)/transactions/transaction-form.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, DollarSign, CheckCircle, Save, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { addTransaction, type NewTransactionData } from "@/services/transaction.service";
import { getCategories } from "@/services/category.service";
import type { Category } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";

const transactionFormSchema = z.object({
  description: z.string().min(2, "A descrição deve ter pelo menos 2 caracteres."),
  amount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")),
    z.number().positive("O valor deve ser positivo.")
  ),
  date: z.date({ required_error: "A data é obrigatória." }),
  type: z.enum(["income", "expense"], { required_error: "Selecione o tipo da transação." }),
  category_id: z.string().min(1, "Selecione uma categoria."),
  is_recurring: z.boolean().optional().default(false),
  recurring_frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().nullable(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  onTransactionCreated: () => void;
  initialData?: Partial<TransactionFormData>;
  isModal?: boolean;
}

export function TransactionForm({ onTransactionCreated, initialData, isModal = true }: TransactionFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, register, formState: { errors }, reset, watch } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialData || {
      type: "expense",
      amount: 0,
      date: new Date(),
      is_recurring: false,
    },
  });

  const transactionType = watch("type");
  const isRecurring = watch("is_recurring");

  const fetchCategoriesData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingCategories(true);
    try {
      const { data, error } = await getCategories(user.id);
      if (error) {
        toast({ title: "Erro ao buscar categorias", description: error.message, variant: "destructive" });
        setCategories([]);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar as categorias.", variant: "destructive" });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && status !== "loading") {
      fetchCategoriesData();
    }
  }, [user, status, fetchCategoriesData]);
  
  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    if (!user?.id) {
      toast({ title: "Erro de Autenticação", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const newTxData: NewTransactionData = {
      description: data.description,
      amount: data.amount,
      date: format(data.date, "yyyy-MM-dd"),
      type: data.type,
      category_id: data.category_id,
      is_recurring: data.is_recurring,
      recurring_frequency: data.is_recurring ? (data.recurring_frequency || 'monthly') : null,
      next_billing_date: data.is_recurring ? format(addMonths(data.date, 1), "yyyy-MM-dd") : null, // Placeholder logic
      notes: data.notes,
    };

    try {
      const result = await addTransaction(user.id, newTxData);
      if (result.error) {
        throw result.error;
      }
      toast({
        title: "Transação Adicionada!",
        description: `A transação "${data.description}" foi adicionada com sucesso.`,
        action: <CheckCircle className="text-green-500" />,
      });
      reset();
      onTransactionCreated();
      if (!isModal) router.push("/transactions");
    } catch (error: any) {
      toast({
        title: "Erro ao Adicionar Transação",
        description: error.message || "Não foi possível salvar a nova transação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === transactionType || cat.is_default);

  if (status === "loading" && !initialData) {
     return (
        <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-end gap-2 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
            id="description"
            placeholder="Ex: Salário, Compras no Supermercado"
            {...register("description")}
            />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150,00"
                    {...register("amount")}
                    className="pl-10"
                    />
                </div>
                {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                 <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                            />
                        </PopoverContent>
                        </Popover>
                    )}
                />
                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
            </div>
        </div>

        <div className="space-y-2">
            <Label>Tipo de Transação</Label>
            <Controller
                name="type"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="income" />
                        <Label htmlFor="income" className="font-normal">Receita</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="expense" />
                        <Label htmlFor="expense" className="font-normal">Despesa</Label>
                    </div>
                    </RadioGroup>
                )}
            />
            {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder={isLoadingCategories ? "Carregando..." : `Selecione uma categoria de ${transactionType === 'income' ? 'receita' : 'despesa'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      {filteredCategories.length === 0 && !isLoadingCategories && (
                        <div className="p-4 text-sm text-muted-foreground">Nenhuma categoria encontrada para este tipo.</div>
                      )}
                    </SelectContent>
                  </Select>
                )}
            />
            {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="is_recurring"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_recurring"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Marcar como transação recorrente"
                />
              )}
            />
            <Label htmlFor="is_recurring" className="font-normal flex items-center">
              <Repeat className="mr-2 h-4 w-4 text-muted-foreground"/>
              Esta é uma transação recorrente? (Ex: Assinatura)
            </Label>
          </div>
          {isRecurring && (
            <div className="pl-8 space-y-2 animate-in fade-in-0">
               <Label htmlFor="recurring_frequency">Frequência</Label>
                 <Controller
                    name="recurring_frequency"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? "monthly"}>
                        <SelectTrigger id="recurring_frequency">
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea 
                id="notes"
                placeholder="Detalhes adicionais sobre a transação..."
                {...register("notes")}
                rows={3}
            />
        </div>

        <DialogFooter className="pt-4">
            {isModal && <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>}
            <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Salvando..." : "Salvar Transação"}
            </Button>
        </DialogFooter>
    </form>
  );
}
