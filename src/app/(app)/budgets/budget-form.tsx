// src/app/(app)/budgets/budget-form.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, CheckCircle, Save, Settings2, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { addBudget, updateBudget, type NewBudgetData, type UpdateBudgetData } from "@/services/budget.service";
import { getCategories, addCategory } from "@/services/category.service";
import type { Category, Budget } from "@/types/database.types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

const budgetFormSchema = z.object({
  category_id: z.string().min(1, "Selecione uma categoria."),
  limit_amount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")),
    z.number().positive("O limite deve ser um valor positivo.")
  ),
  period_start_date: z.date({ required_error: "Data de início é obrigatória." }),
  period_end_date: z.date({ required_error: "Data de término é obrigatória." }),
}).refine(data => data.period_end_date >= data.period_start_date, {
  message: "A data de término deve ser igual ou posterior à data de início.",
  path: ["period_end_date"],
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

const newCategorySchema = z.object({
  name: z.string().min(2, "Nome da categoria deve ter no mínimo 2 caracteres.").max(50, "Nome da categoria muito longo."),
  icon: z.string().optional(),
});
type NewCategoryFormData = z.infer<typeof newCategorySchema>;

interface BudgetFormProps {
  onFormSuccess: () => void;
  initialData?: Budget;
  isModal?: boolean;
}

export function BudgetForm({ onFormSuccess, initialData, isModal = true }: BudgetFormProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const isEditing = !!initialData;

  const { control, handleSubmit, register, formState: { errors }, reset, setValue } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        limit_amount: initialData.limit_amount,
        period_start_date: parseISO(initialData.period_start_date),
        period_end_date: parseISO(initialData.period_end_date),
    } : {
      limit_amount: 0,
      period_start_date: new Date(),
      period_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    },
  });

  const { handleSubmit: handleCategorySubmit, register: categoryFormRegister, formState: { errors: categoryFormErrors }, reset: resetCategoryForm } = useForm<NewCategoryFormData>({
    resolver: zodResolver(newCategorySchema),
  });

  const fetchCategories = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await getCategories(user.id);
      if (error) throw error;
      setCategories(data?.filter(c => c.type === 'expense') || []);
    } catch (err: any) {
      toast({ title: "Erro ao buscar categorias", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchCategories();
  }, [user, fetchCategories]);

  const onBudgetSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    if (!user?.id) { toast({ title: "Erro de Autenticação", variant: "destructive" }); return; }
    setIsLoading(true);

    const budgetData = {
      category_id: data.category_id,
      limit_amount: data.limit_amount,
      period_start_date: format(data.period_start_date, "yyyy-MM-dd"),
      period_end_date: format(data.period_end_date, "yyyy-MM-dd"),
    };

    try {
      let result;
      if (isEditing) {
        result = await updateBudget(initialData.id, user.id, budgetData as UpdateBudgetData);
        if (result.error) throw result.error;
        toast({ title: "Orçamento Atualizado!", action: <CheckCircle className="text-green-500" /> });
      } else {
        result = await addBudget(user.id, budgetData as NewBudgetData);
        if (result.error) throw result.error;
        toast({ title: "Orçamento Criado!", action: <CheckCircle className="text-green-500" /> });
      }
      reset();
      onFormSuccess();
    } catch (error: any) {
      toast({ title: isEditing ? "Erro ao Atualizar" : "Erro ao Criar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onCategorySubmit: SubmitHandler<NewCategoryFormData> = async (data) => {
     if (!user?.id) { toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" }); return; }
    try {
      const result = await addCategory(user.id, { name: data.name, type: 'expense', icon: data.icon });
      if (result.error) throw result.error;
      toast({ title: "Categoria Criada!", description: `Categoria "${result.data?.name}" criada.` });
      await fetchCategories();
      if (result.data?.id) setValue("category_id", result.data.id);
      resetCategoryForm();
      setIsCategoryModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao Criar Categoria", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onBudgetSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <div className="flex items-center gap-2">
          <Controller name="category_id" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}><SelectTrigger id="category_id" className="flex-grow"><SelectValue placeholder={isLoading ? "Carregando..." : "Selecione uma categoria"} /></SelectTrigger><SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select>
          )} />
          <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/>Nova Categoria de Despesa</DialogTitle><DialogDescription>Crie uma nova categoria para seus orçamentos.</DialogDescription></DialogHeader>
              <form onSubmit={handleCategorySubmit(onCategorySubmit)} className="space-y-4 py-2">
                <div><Label htmlFor="new_cat_name">Nome</Label><Input id="new_cat_name" {...categoryFormRegister("name")} />{categoryFormErrors.name && <p className="text-sm text-destructive mt-1">{categoryFormErrors.name.message}</p>}</div>
                <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Criar Categoria</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>}
      </div>
      <div className="space-y-2"><Label htmlFor="limit_amount">Valor Limite (R$)</Label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="limit_amount" type="number" step="0.01" {...register("limit_amount")} className="pl-10" /></div>{errors.limit_amount && <p className="text-sm text-destructive mt-1">{errors.limit_amount.message}</p>}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Data de Início</Label><Controller name="period_start_date" control={control} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover>)} />{errors.period_start_date && <p className="text-sm text-destructive mt-1">{errors.period_start_date.message}</p>}</div>
        <div className="space-y-2"><Label>Data de Término</Label><Controller name="period_end_date" control={control} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover>)} />{errors.period_end_date && <p className="text-sm text-destructive mt-1">{errors.period_end_date.message}</p>}</div>
      </div>
      {errors.root && <p className="text-sm text-destructive mt-1">{errors.root.message}</p>}
      <CardFooter className="flex justify-end gap-2 px-0 pt-4">
        {isModal && <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>}
        <Button type="submit" disabled={isLoading}><Save className="mr-2 h-4 w-4"/>{isLoading ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Criar Orçamento")}</Button>
      </CardFooter>
    </form>
  );
}
