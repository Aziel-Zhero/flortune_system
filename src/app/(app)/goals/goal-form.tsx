
// src/app/(app)/goals/goal-form.tsx
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
import { CalendarIcon, DollarSign, CheckCircle, Trophy, Tag, Briefcase, Car, Plane, Home, ShoppingBag, Gift, BookOpen, Laptop, Heart, Save, AlertTriangle, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { addFinancialGoal, type NewFinancialGoalData } from "@/services/goal.service";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { NO_ICON_VALUE } from "@/lib/constants";

const goalFormSchema = z.object({
  name: z.string().min(3, "O nome da meta deve ter pelo menos 3 caracteres."),
  target_amount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")),
    z.number().positive("O valor alvo deve ser positivo.")
  ),
  deadline_date: z.date().optional().nullable(),
  icon: z.string().optional().nullable(), // Mantém string, mas usaremos NO_ICON_VALUE para 'nenhum'
  notes: z.string().optional().nullable(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

const availableIcons = [
  { name: "Nenhum", value: NO_ICON_VALUE, icon: Tag },
  { name: "Viagem", value: "Plane", icon: Plane },
  { name: "Casa", value: "Home", icon: Home },
  { name: "Carro", value: "Car", icon: Car },
  { name: "Educação", value: "BookOpen", icon: BookOpen },
  { name: "Eletrônicos", value: "Laptop", icon: Laptop },
  { name: "Compras", value: "ShoppingBag", icon: ShoppingBag },
  { name: "Presente", value: "Gift", icon: Gift },
  { name: "Saúde", value: "Heart", icon: Heart },
  { name: "Negócios", value: "Briefcase", icon: Briefcase },
  { name: "Troféu", value: "Trophy", icon: Trophy },
];

const getLucideIcon = (iconName?: string | null): React.ElementType => {
  if (!iconName || iconName === NO_ICON_VALUE) return Tag;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Tag;
};

interface FinancialGoalFormProps {
  onGoalCreated: () => void;
  initialData?: Partial<GoalFormData>;
  isModal?: boolean;
}

export function FinancialGoalForm({ onGoalCreated, initialData, isModal = true }: FinancialGoalFormProps) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const user = session?.user;
  const isAuthLoading = authStatus === "loading";

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: initialData || { name: "", target_amount: 0, deadline_date: null, icon: NO_ICON_VALUE, notes: "" },
  });

  const onSubmit: SubmitHandler<GoalFormData> = async (data) => {
    if (!user?.id) {
      toast({ title: "Erro de Autenticação", description: "Usuário não encontrado. Por favor, faça login novamente.", variant: "destructive" });
      setIsSubmitting(false); 
      return;
    }
    setIsSubmitting(true);
    const newGoalData: NewFinancialGoalData = {
      name: data.name, 
      target_amount: data.target_amount, 
      deadline_date: data.deadline_date ? format(data.deadline_date, "yyyy-MM-dd") : null, 
      icon: data.icon === NO_ICON_VALUE ? null : data.icon, // Converte NO_ICON_VALUE para null
      notes: data.notes,
    };
    try {
      const result = await addFinancialGoal(user.id, newGoalData);
      if (result.error) throw result.error;
      toast({ title: "Meta Criada!", description: `Sua meta "${data.name}" foi criada com sucesso.`, action: <CheckCircle className="text-green-500" />, });
      reset({ name: "", target_amount: 0, deadline_date: null, icon: NO_ICON_VALUE, notes: "" }); 
      onGoalCreated(); 
      if (!isModal) router.push("/goals");
    } catch (error: any) {
      toast({ title: "Erro ao Criar Meta", description: error.message || "Não foi possível salvar a nova meta.", variant: "destructive", });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading && !user) { 
    return (
      <div className="space-y-4 py-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados da sessão...</p>
      </div>
    );
  }

  if (!user && !isAuthLoading) { 
    return (
      <div className="py-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
        <p className="text-muted-foreground font-semibold">Você precisa estar logado para criar uma meta.</p>
        <p className="text-sm text-muted-foreground">Por favor, faça login e tente novamente.</p>
         <DialogFooter className="pt-4">
            {isModal && <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting || isAuthLoading || !user}>Cancelar</Button></DialogClose>}
          </DialogFooter>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="goal-form-name">Nome da Meta</Label>
        <Input id="goal-form-name" placeholder="Ex: Viagem de Férias, Reserva de Emergência" {...register("name")} disabled={isSubmitting || isAuthLoading} />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-form-target_amount">Valor Alvo (R$)</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="goal-form-target_amount" type="number" step="0.01" placeholder="Ex: 5000,00" {...register("target_amount")} className="pl-10" disabled={isSubmitting || isAuthLoading} />
        </div>
        {errors.target_amount && <p className="text-sm text-destructive mt-1">{errors.target_amount.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="goal-form-deadline_date-trigger">Data Limite (Opcional)</Label>
          <Controller name="deadline_date" control={control} render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button id="goal-form-deadline_date-trigger" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting || isAuthLoading}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent>
            </Popover>
          )} />
          {errors.deadline_date && <p className="text-sm text-destructive mt-1">{errors.deadline_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-form-icon">Ícone (Opcional)</Label>
          <Controller name="icon" control={control} render={({ field }) => {
            const CurrentSelectedIconComponent = getLucideIcon(field.value); 
            return (
              <Select
                onValueChange={field.onChange}
                value={field.value ?? NO_ICON_VALUE} // Garante que o valor nunca seja nulo/undefined para o Select
                disabled={isSubmitting || isAuthLoading}
              >
                <SelectTrigger id="goal-form-icon">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                        <CurrentSelectedIconComponent className="h-4 w-4 text-muted-foreground" />
                        <span>{availableIcons.find(opt => opt.value === (field.value ?? NO_ICON_VALUE))?.name || "Selecione um ícone"}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map((iconOpt) => {
                    const IconComp = iconOpt.icon;
                    return (
                      <SelectItem key={iconOpt.value} value={iconOpt.value}>
                        <div className="flex items-center gap-2"><IconComp className="h-4 w-4" />{iconOpt.name}</div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            );
          }} />
          {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-form-notes">Notas Adicionais (Opcional)</Label>
        <Textarea id="goal-form-notes" placeholder="Detalhes sobre a meta, estratégias de economia, etc." {...register("notes")} rows={3} disabled={isSubmitting || isAuthLoading} />
        {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
      </div>

      <DialogFooter className="pt-4">
        {isModal && <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting || isAuthLoading || !user}>Cancelar</Button></DialogClose>}
        <Button type="submit" disabled={isSubmitting || isAuthLoading || !user}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSubmitting ? "Salvando..." : "Salvar Meta"}
        </Button>
      </DialogFooter>
    </form>
  );
}

    