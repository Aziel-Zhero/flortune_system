
// src/app/(app)/transactions/transaction-form.tsx
"use client";

import { useState, useEffect } from "react";
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
import { CalendarIcon, DollarSign, CheckCircle, Save, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
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

interface TransactionFormProps {
  onTransactionCreated: () => void;
  initialData?: Partial<TransactionFormData>;
  isModal?: boolean;
}

// Mock categories since we have no DB
const mockCategories = [
    { id: 'cat_1', name: 'Salário', type: 'income' },
    { id: 'cat_2', name: 'Renda Extra', type: 'income' },
    { id: 'cat_3', name: 'Moradia', type: 'expense' },
    { id: 'cat_4', name: 'Alimentação', type: 'expense' },
    { id: 'cat_5', name: 'Transporte', type: 'expense' },
    { id: 'cat_6', name: 'Lazer', type: 'expense' },
    { id: 'cat_7', name: 'Outros', type: 'expense' },
];

export function TransactionForm({ onTransactionCreated, initialData, isModal = true }: TransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  const onSubmit: SubmitHandler<TransactionFormData> = async (data) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("Mock Transaction Data:", data);

    toast({
      title: "Transação Adicionada (Simulação)!",
      description: `A transação "${data.description}" foi adicionada com sucesso.`,
      action: <CheckCircle className="text-green-500" />,
    });
    
    reset();
    onTransactionCreated();
    if (!isModal) router.push("/transactions");
    
    setIsSubmitting(false);
  };

  const filteredCategories = mockCategories.filter(cat => cat.type === transactionType);

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
                            {isClient && field.value ? format(field.value, "PPP", { locale: ptBR }) : field.value ? format(field.value, "yyyy-MM-dd") : <span>Escolha uma data</span>}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder={`Selecione uma categoria de ${transactionType === 'income' ? 'receita' : 'despesa'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
            />
            {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
            <Controller
                name="is_recurring"
                control={control}
                render={({ field }) => (
                    <Checkbox
                        id="is_recurring"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
            />
            <Label htmlFor="is_recurring" className="font-normal text-sm text-muted-foreground flex items-center gap-1.5">
                <Repeat className="h-3 w-3" />
                Marcar como transação recorrente.
            </Label>
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
            <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Salvando..." : "Salvar Transação"}
            </Button>
        </DialogFooter>
    </form>
  );
}
