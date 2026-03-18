
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
import { CalendarIcon, DollarSign, CheckCircle, Save, Repeat, PlusCircle, Settings2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/contexts/auth-context";
import { addTransaction, type NewTransactionData } from "@/services/transaction.service";
import { getCategories, addCategory } from "@/services/category.service";
import type { Category } from "@/types/database.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const transactionFormSchema = z.object({
  description: z.string().min(2, "A descrição deve ter pelo menos 2 caracteres."),
  amount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")),
    z.number().positive("O valor deve ser positivo.")
  ),
  date: z.date({ required_error: "A data é obrigatória." }),
  type: z.enum(["income", "expense"], { required_error: "Selecione o tipo da transação." }),
  category_id: z.string().min(1, "Selecione uma categoria."),
  notes: z.string().optional(),
  is_recurring: z.boolean().optional().default(false),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

const newCategorySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres.").max(50, "Muito longo."),
});
type NewCategoryFormData = z.infer<typeof newCategorySchema>;

interface TransactionFormProps {
  onTransactionCreated: () => void;
  initialData?: Partial<TransactionFormData>;
  isModal?: boolean;
}

export function TransactionForm({ onTransactionCreated, initialData, isModal = true }: TransactionFormProps) {
  const router = useRouter();
  const { session } = useSession();
  const user = session?.user;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { control, handleSubmit, register, formState: { errors }, reset, watch, setValue } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: initialData?.description || "",
      type: initialData?.type || "expense",
      amount: initialData?.amount || 0,
      date: initialData?.date || new Date(),
      is_recurring: initialData?.is_recurring || false,
      category_id: initialData?.category_id || "", 
      notes: initialData?.notes || "",
    },
  });

  const { register: catRegister, handleSubmit: handleCatSubmit, reset: resetCatForm, formState: { errors: catErrors } } = useForm<NewCategoryFormData>({
    resolver: zodResolver(newCategorySchema)
  });

  const transactionType = watch("type");

  const fetchCategoriesData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingCategories(true);
    try {
      const { data } = await getCategories(user.id);
      setCategories(data || []);
    } catch (err) {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setIsClient(true);
    if (user?.id) {
      fetchCategoriesData();
    }
  }, [user?.id, fetchCategoriesData]);
  
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
      notes: data.notes || "",
      is_recurring: data.is_recurring ?? false,
    };

    try {
      const result = await addTransaction(user.id, newTxData);
      if (result.error) throw new Error(result.error);

      toast({ title: "Transação Adicionada!", description: `"${data.description}" salva com sucesso.`, action: <CheckCircle className="text-green-500" /> });
      reset();
      onTransactionCreated();
      if (!isModal) router.push("/transactions");
    } catch (error: any) {
      toast({ title: "Erro ao Adicionar", description: error.message || "Falha ao salvar transação.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCategorySubmit: SubmitHandler<NewCategoryFormData> = async (data) => {
    const { data: newCat, error } = await addCategory({ name: data.name, type: transactionType });
    if (error) {
        toast({ title: "Erro", description: error, variant: "destructive" });
    } else if (newCat) {
        setCategories(prev => [...prev, newCat]);
        setValue("category_id", newCat.id, { shouldValidate: true });
        toast({ title: "Categoria Criada!" });
        setIsCategoryModalOpen(false);
        resetCatForm();
    }
  };

  const filteredCategories = categories.filter(cat => cat && (cat.type === transactionType || cat.is_default));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" placeholder="Ex: Salário, Supermercado" {...register("description")} disabled={isSubmitting} />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="amount" type="number" step="0.01" {...register("amount")} className="pl-10" disabled={isSubmitting} />
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
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {isClient && field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
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
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={isSubmitting}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="income" id="income" /><Label htmlFor="income" className="font-normal">Receita</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="expense" id="expense" /><Label htmlFor="expense" className="font-normal">Despesa</Label></div>
                    </RadioGroup>
                )}
            />
            {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <div className="flex items-center gap-2">
                <Controller
                    name="category_id"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingCategories || isSubmitting}>
                        <SelectTrigger id="category_id">
                        <SelectValue placeholder={isLoadingCategories ? "Carregando..." : `Selecione`} />
                        </SelectTrigger>
                        <SelectContent>
                        {filteredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                    <DialogTrigger asChild><Button type="button" variant="outline" size="icon" title="Nova Categoria"><PlusCircle className="h-4 w-4"/></Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5"/> Nova Categoria</DialogTitle><DialogDescription>Crie uma categoria para suas {transactionType === 'income' ? 'receitas' : 'despesas'}.</DialogDescription></DialogHeader>
                        <form onSubmit={handleCatSubmit(onCategorySubmit)} className="space-y-4 py-2">
                            <div><Label>Nome da Categoria</Label><Input {...catRegister("name")} />{catErrors.name && <p className="text-xs text-destructive">{catErrors.name.message}</p>}</div>
                            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Criar</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
            <Controller
                name="is_recurring"
                control={control}
                render={({ field }) => (
                    <Checkbox id="is_recurring" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                )}
            />
            <Label htmlFor="is_recurring" className="font-normal text-sm text-muted-foreground flex items-center gap-1.5">
                <Repeat className="h-3 w-3" /> Marcar como transação recorrente.
            </Label>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea id="notes" placeholder="Detalhes adicionais..." {...register("notes")} rows={3} disabled={isSubmitting} />
        </div>

        <DialogFooter className="pt-4">
            {isModal && <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>}
            <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
                <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Salvando..." : "Salvar Transação"}
            </Button>
        </DialogFooter>
    </form>
  );
}
