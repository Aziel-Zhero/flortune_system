// src/app/(app)/dev/systems/freelancer-billing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, AlertCircle, BarChartHorizontalBig, HelpCircle, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";
import { CurrencySelector } from "@/components/shared/currency-selector";

const billingSchema = z.object({
  hourlyRate: z.coerce.number().positive("O valor/hora deve ser positivo."),
  hoursPerDay: z.coerce.number().min(0, "Deve ser no mínimo 0.").max(24, "Máximo de 24 horas."),
  workDaysPerWeek: z.coerce.number().min(0, "Deve ser entre 0 e 7.").max(7, "Máximo de 7 dias."),
  vacationWeeksPerYear: z.coerce.number().min(0, "Não pode ser negativo.").max(52, "Máximo de 52 semanas."),
});

type BillingFormData = z.infer<typeof billingSchema>;

export default function FreelancerBillingPage() {
  const [monthlyBilling, setMonthlyBilling] = useState<number | null>(null);
  const [annualBilling, setAnnualBilling] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [currency, setCurrency] = useState('BRL');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
  });

  useEffect(() => {
    document.title = `Faturamento Freelancer - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<BillingFormData> = (data) => {
    try {
      const weeksInYear = 52.1775;
      const workWeeks = weeksInYear - data.vacationWeeksPerYear;
      
      const totalHoursPerYear = data.hoursPerDay * data.workDaysPerWeek * workWeeks;
      const calculatedAnnualBilling = totalHoursPerYear * data.hourlyRate;
      const calculatedMonthlyBilling = calculatedAnnualBilling / 12;

      setAnnualBilling(calculatedAnnualBilling);
      setMonthlyBilling(calculatedMonthlyBilling);

      toast({ title: "Cálculo Realizado", description: "Seu faturamento potencial foi calculado." });
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o faturamento.", variant: "destructive" });
    }
  };
  
  const handleReset = () => {
    reset();
    setAnnualBilling(null);
    setMonthlyBilling(null);
  };

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
    <div>
      <PageHeader
        title="Calculadora de Faturamento Dev Freelancer"
        description="Planeje seu faturamento com base em sua carga horária, folgas e valor/hora."
        icon={<DollarSign className="h-6 w-6 text-primary" />}
        actions={<Button asChild variant="outline"><Link href="/dev/systems"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle className="font-headline">Parâmetros de Trabalho</CardTitle>
                <DialogTrigger asChild><Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5 text-muted-foreground"/></Button></DialogTrigger>
            </div>
            <CardDescription>Insira sua rotina de trabalho para estimar seu potencial de faturamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CurrencySelector value={currency} onChange={setCurrency} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Seu Valor/Hora ({currency})</Label>
                <Input id="hourlyRate" type="number" step="0.01" placeholder="Ex: 100" {...register("hourlyRate")} />
                {errors.hourlyRate && <p className="text-sm text-destructive mt-1">{errors.hourlyRate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoursPerDay">Horas de Trabalho por Dia</Label>
                <Input id="hoursPerDay" type="number" placeholder="Ex: 6" {...register("hoursPerDay")} />
                {errors.hoursPerDay && <p className="text-sm text-destructive mt-1">{errors.hoursPerDay.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workDaysPerWeek">Dias Trabalhados por Semana</Label>
                <Input id="workDaysPerWeek" type="number" placeholder="Ex: 5" {...register("workDaysPerWeek")} />
                {errors.workDaysPerWeek && <p className="text-sm text-destructive mt-1">{errors.workDaysPerWeek.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacationWeeksPerYear">Semanas de Férias por Ano</Label>
                <Input id="vacationWeeksPerYear" type="number" placeholder="Ex: 4" {...register("vacationWeeksPerYear")} />
                {errors.vacationWeeksPerYear && <p className="text-sm text-destructive mt-1">{errors.vacationWeeksPerYear.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button type="submit">Calcular Faturamento</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {annualBilling !== null && monthlyBilling !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Faturamento Potencial:</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Faturamento Mensal Médio:</p>
                    <p className="text-xl font-bold text-primary">
                        {monthlyBilling.toLocaleString('pt-BR', { style: 'currency', currency: currency })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Faturamento Anual Bruto:</p>
                    <p className="text-xl font-bold text-primary">
                        {annualBilling.toLocaleString('pt-BR', { style: 'currency', currency: currency })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && annualBilling === null && (
                 <Alert variant="destructive" className="w-full mt-2">
                    <AlertCircle size={18} className="h-4 w-4" />
                    <AlertTitle>Erro de Validação</AlertTitle>
                    <AlertDescription>Por favor, corrija os erros no formulário para calcular.</AlertDescription>
                </Alert>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
    <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Como Usar Esta Calculadora</DialogTitle>
          <DialogDescription>
            Planeje suas metas financeiras como freelancer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm text-muted-foreground">
           <p>Esta ferramenta ajuda a visualizar seu potencial de ganho com base em sua disponibilidade e valor/hora. Lembre-se que este é o faturamento bruto.</p>
           <ul className="list-disc list-inside space-y-1">
                <li>**Horas de Trabalho:** Seja realista. Considere apenas as horas que você efetivamente dedica a trabalho faturável (billable hours).</li>
                <li>**Custos:** O valor calculado é bruto. Lembre-se de deduzir seus impostos, custos operacionais (internet, software) e contribuições.</li>
                <li>**Prospecção:** O cálculo assume uma taxa de ocupação de 100%. Lembre-se que o tempo gasto em prospecção e gestão não é faturável diretamente.</li>
           </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Entendi</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
