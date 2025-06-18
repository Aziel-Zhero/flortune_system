
// src/app/(app)/budgets/new/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, CheckCircle, Target, PlusCircle, Save, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { addBudget, type NewBudgetData } from "@/services/budget.service";
import { getCategories, addCategory } from "@/services/category.service";
import type { Category } from "@/types/database.types";
import { APP_NAME } from "@/lib/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
  name: z.string().min(2, "Nome da categoria é obrigatório."),
  icon: z.string().optional(),
});
type NewCategoryFormData = z.infer<typeof newCategorySchema>;


export default function NewBudgetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { control, handleSubmit, register, formState: { errors }, reset, watch, setValue } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      limit_amount: 0,
      period_start_date: new Date(),
      period_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 
    },
  });

  const { control: categoryFormControl, handleSubmit: handleCategorySubmit, register: categoryFormRegister, formState: { errors: categoryFormErrors }, reset: resetCategoryForm } = useForm<NewCategoryFormData>({
    resolver: zodResolver(newCategorySchema),
  });


  const fetchCategories = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingCategories(true);
    try {
      const { data, error } = await getCategories(user.id);
      if (error) {
        toast({ title: "Erro ao buscar categorias", description: error.message, variant: "destructive" });
        setCategories([]);
      } else {
        setCategories(data?.filter(c => c.type === 'expense') || []); 
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar as categorias.", variant: "destructive" });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [user?.id]);

  useEffect(() => {
    document.title = `Novo Orçamento - ${APP_NAME}`;
    if (user?.id && status !== "loading") {
      fetchCategories();
    }
  }, [user, status, fetchCategories]);
  
  const onBudgetSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    if (!user?.id) {
      toast({ title: "Erro de Autenticação", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const newBudgetData: NewBudgetData = {
      category_id: data.category_id,
      limit_amount: data.limit_amount,
      period_start_date: format(data.period_start_date, "yyyy-MM-dd"),
      period_end_date: format(data.period_end_date, "yyyy-MM-dd"),
    };

    try {
      const result = await addBudget(user.id, newBudgetData);
      if (result.error) {
        throw result.error;
      }
      toast({
        title: "Orçamento Criado!",
        description: `O orçamento para ${categories.find(c => c.id === data.category_id)?.name || 'a categoria selecionada'} foi criado com sucesso.`,
        action: <CheckCircle className="text-green-500" />,
      });
      reset();
      router.push("/budgets");
    } catch (error: any) {
      toast({
        title: "Erro ao Criar Orçamento",
        description: error.message || "Não foi possível salvar o novo orçamento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCategorySubmit: SubmitHandler<NewCategoryFormData> = async (data) => {
    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    try {
      const result = await addCategory(user.id, { name: data.name, type: 'expense', icon: data.icon });
      if (result.error) throw result.error;

      toast({ title: "Categoria Criada!", description: `Categoria "${result.data?.name}" criada com sucesso.` });
      fetchCategories(); // Re-fetch categories
      if (result.data?.id) {
         setValue("category_id", result.data.id); // Auto-seleciona a categoria criada
      }
      resetCategoryForm();
      setIsCategoryModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao Criar Categoria", description: error.message, variant: "destructive" });
    }
  };


  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="Novo Orçamento" description="Defina um novo limite de gastos para uma categoria." />
        <Card className="shadow-sm">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-24 ml-auto" /></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Novo Orçamento"
        description="Defina um novo limite de gastos para uma categoria específica em um período."
        icon={<Target className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onBudgetSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Orçamento</CardTitle>
            <CardDescription>
              Escolha uma categoria de despesa, defina o valor limite e o período do orçamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories} >
                      <SelectTrigger id="category_id" className="flex-grow">
                        <SelectValue placeholder={isLoadingCategories ? "Carregando categorias..." : "Selecione uma categoria de despesa"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        {categories.length === 0 && !isLoadingCategories && (
                          <div className="p-4 text-sm text-muted-foreground">Nenhuma categoria de despesa encontrada.</div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                 <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" aria-label="Criar nova categoria">
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                        <DialogTitle className="font-headline flex items-center">
                            <Settings2 className="mr-2 h-5 w-5 text-primary"/>
                            Nova Categoria de Despesa
                        </DialogTitle>
                        <DialogDescription>
                            Crie uma nova categoria para seus orçamentos.
                        </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCategorySubmit(onCategorySubmit)} className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="new_category_name">Nome da Categoria</Label>
                                <Input id="new_category_name" {...categoryFormRegister("name")} />
                                {categoryFormErrors.name && <p className="text-sm text-destructive mt-1">{categoryFormErrors.name.message}</p>}
                            </div>
                            {/* Adicionar seleção de ícone aqui se desejar */}
                            <DialogFooter className="pt-2">
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit">Criar Categoria</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
              </div>
              {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit_amount">Valor Limite (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="limit_amount"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 500,00"
                  {...register("limit_amount")}
                  className="pl-10"
                />
              </div>
              {errors.limit_amount && <p className="text-sm text-destructive mt-1">{errors.limit_amount.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start_date">Data de Início</Label>
                <Controller
                    name="period_start_date"
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
                {errors.period_start_date && <p className="text-sm text-destructive mt-1">{errors.period_start_date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end_date">Data de Término</Label>
                 <Controller
                    name="period_end_date"
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
                {errors.period_end_date && <p className="text-sm text-destructive mt-1">{errors.period_end_date.message}</p>}
              </div>
            </div>
             {errors.root && <p className="text-sm text-destructive mt-1">{errors.root.message}</p>}


          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
              <Save className="mr-2 h-4 w-4"/>
              {isSubmitting ? "Salvando..." : "Criar Orçamento"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

    