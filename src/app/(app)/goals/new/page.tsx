
// src/app/(app)/goals/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, CheckCircle, Trophy, Tag, Briefcase, Car, Plane, Home, ShoppingBag, Gift, BookOpen, Laptop, Heart } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { addFinancialGoal, type NewFinancialGoalData } from "@/services/goal.service";
import { APP_NAME } from "@/lib/constants";

const goalFormSchema = z.object({
  name: z.string().min(3, "O nome da meta deve ter pelo menos 3 caracteres."),
  target_amount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")),
    z.number().positive("O valor alvo deve ser positivo.")
  ),
  deadline_date: z.date().optional().nullable(),
  icon: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

const availableIcons = [
  { name: "Nenhum", value: null, icon: Tag },
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
  if (!iconName) return Tag; 
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Tag;
};

export default function NewGoalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      target_amount: 0,
      deadline_date: null,
      icon: null,
      notes: "",
    },
  });
  
  useEffect(() => {
    document.title = `Nova Meta Financeira - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<GoalFormData> = async (data) => {
    if (!user?.id) {
      toast({ title: "Erro de Autenticação", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const newGoalData: NewFinancialGoalData = {
      name: data.name,
      target_amount: data.target_amount,
      deadline_date: data.deadline_date ? format(data.deadline_date, "yyyy-MM-dd") : null,
      icon: data.icon,
      notes: data.notes,
    };

    try {
      const result = await addFinancialGoal(user.id, newGoalData);
      if (result.error) {
        throw result.error;
      }
      toast({
        title: "Meta Criada!",
        description: `Sua meta "${data.name}" foi criada com sucesso.`,
        action: <CheckCircle className="text-green-500" />,
      });
      reset();
      router.push("/goals");
    } catch (error: any) {
      toast({
        title: "Erro ao Criar Meta",
        description: error.message || "Não foi possível salvar a nova meta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="Nova Meta Financeira" description="Defina um novo objetivo para suas finanças." />
        <Card className="shadow-sm">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-24 ml-auto" /></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nova Meta Financeira"
        description="Defina um novo objetivo para suas finanças e acompanhe seu progresso."
        icon={<Trophy className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes da Meta</CardTitle>
            <CardDescription>
              Descreva sua meta, o valor que deseja alcançar e, opcionalmente, um prazo e ícone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Meta</Label>
              <Input
                id="name"
                placeholder="Ex: Viagem de Férias, Reserva de Emergência"
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Valor Alvo (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5000,00"
                  {...register("target_amount")}
                  className="pl-10"
                />
              </div>
              {errors.target_amount && <p className="text-sm text-destructive mt-1">{errors.target_amount.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="deadline_date">Data Limite (Opcional)</Label>
                    <Controller
                        name="deadline_date"
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
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                locale={ptBR}
                                />
                            </PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.deadline_date && <p className="text-sm text-destructive mt-1">{errors.deadline_date.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="icon">Ícone (Opcional)</Label>
                    <Controller
                        name="icon"
                        control={control}
                        render={({ field }) => {
                           const SelectedIcon = getLucideIcon(field.value);
                           return (
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <SelectTrigger id="icon">
                                <SelectValue placeholder={
                                    <div className="flex items-center gap-2">
                                        <SelectedIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>Selecione um ícone</span>
                                    </div>
                                } />
                                </SelectTrigger>
                                <SelectContent>
                                {availableIcons.map((iconOpt) => {
                                    const IconComp = iconOpt.icon;
                                    return (
                                    <SelectItem key={iconOpt.value || 'none'} value={iconOpt.value || ''}>
                                        <div className="flex items-center gap-2">
                                        <IconComp className="h-4 w-4" />
                                        {iconOpt.name}
                                        </div>
                                    </SelectItem>
                                    );
                                })}
                                </SelectContent>
                            </Select>
                           );
                        }}
                    />
                     {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionais (Opcional)</Label>
                <Textarea 
                    id="notes"
                    placeholder="Detalhes sobre a meta, estratégias de economia, etc."
                    {...register("notes")}
                    rows={3}
                />
                {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Criar Meta"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

