// src/app/(app)/dev/systems/automation-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, DollarSign, Repeat, AlertCircle, BarChartHorizontalBig } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const roiPricingSchema = z.object({
  annualClientGain: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Ganho anual deve ser positivo."),
  monthlyAutomatorCosts: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Custos não podem ser negativos."),
  monthlySupportCost: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Custo de suporte não pode ser negativo."),
});

type RoiPricingFormData = z.infer<typeof roiPricingSchema>;

export default function AutomationPricingPage() {
  const [setupFee, setSetupFee] = useState<number | null>(null);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [clientPaybackMonths, setClientPaybackMonths] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RoiPricingFormData>({
    resolver: zodResolver(roiPricingSchema),
  });

  useEffect(() => {
    document.title = `Precificação de Automação (ROI) - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<RoiPricingFormData> = (data) => {
    try {
      const calculatedSetupFee = data.annualClientGain * 0.25;
      const calculatedMonthlyFee = (data.monthlyAutomatorCosts + data.monthlySupportCost) * 2;
      
      let payback = null;
      if (data.annualClientGain > 0) {
        const monthlyClientGain = data.annualClientGain / 12;
        if (monthlyClientGain > 0) {
            const netMonthlyGainForClientAfterPayingFee = monthlyClientGain - calculatedMonthlyFee;
            if (netMonthlyGainForClientAfterPayingFee > 0) {
                 payback = calculatedSetupFee / netMonthlyGainForClientAfterPayingFee;
            } else if (calculatedSetupFee === 0 && netMonthlyGainForClientAfterPayingFee === 0 && monthlyClientGain > 0) {
                 payback = 0;
            } else {
                payback = Infinity;
            }
        } else {
            payback = Infinity;
        }
      }

      setSetupFee(calculatedSetupFee);
      setMonthlyFee(calculatedMonthlyFee);
      setClientPaybackMonths(payback);

      toast({ title: "Cálculo Realizado", description: "Precificação baseada em ROI calculada."});
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular a precificação.", variant: "destructive"});
      setSetupFee(null);
      setMonthlyFee(null);
      setClientPaybackMonths(null);
    }
  };
  
  const handleReset = () => {
    reset({
        annualClientGain: undefined,
        monthlyAutomatorCosts: undefined,
        monthlySupportCost: undefined,
    });
    setSetupFee(null);
    setMonthlyFee(null);
    setClientPaybackMonths(null);
  }

  return (
    <div>
      <PageHeader
        title="Precificação de Automação (Baseada em ROI)"
        description="Calcule o preço de setup e mensalidade para projetos de automação, focando no retorno sobre o investimento do cliente."
        icon={<Briefcase className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Parâmetros da Automação</CardTitle>
            <CardDescription>
              Insira os ganhos estimados para o cliente e seus custos para calcular a precificação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="annualClientGain">Ganho Anual Estimado para o Cliente (R$)</Label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input id="annualClientGain" type="number" step="0.01" placeholder="Ex: 50000" {...register("annualClientGain")} className="pl-10" />
              </div>
              {errors.annualClientGain && <p className="text-sm text-destructive mt-1">{errors.annualClientGain.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyAutomatorCosts">Seus Custos Mensais (R$)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="monthlyAutomatorCosts" type="number" step="0.01" placeholder="Ex: 200" {...register("monthlyAutomatorCosts")} className="pl-10" />
                </div>
                {errors.monthlyAutomatorCosts && <p className="text-sm text-destructive mt-1">{errors.monthlyAutomatorCosts.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlySupportCost">Custo de Suporte Mensal (R$)</Label>
                 <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="monthlySupportCost" type="number" step="0.01" placeholder="Ex: 100" {...register("monthlySupportCost")} className="pl-10" />
                </div>
                {errors.monthlySupportCost && <p className="text-sm text-destructive mt-1">{errors.monthlySupportCost.message}</p>}
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
             <div className="flex gap-2">
                <Button type="submit">Calcular Precificação ROI</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>

            {(setupFee !== null || monthlyFee !== null) && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Resultados da Precificação ROI:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {setupFee !== null && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taxa de Setup Sugerida (25% do ganho anual):</p>
                      <p className="text-xl font-bold text-primary">
                        R$ <PrivateValue value={setupFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </p>
                    </div>
                  )}
                  {monthlyFee !== null && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Mensalidade Sugerida (Dobro dos custos + suporte):</p>
                      <p className="text-xl font-bold text-primary">
                        R$ <PrivateValue value={monthlyFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /> / mês
                      </p>
                    </div>
                  )}
                  {clientPaybackMonths !== null && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Payback Estimado para o Cliente:</p>
                      <p className="text-lg font-semibold">
                        {clientPaybackMonths === Infinity 
                            ? "ROI não alcançado ou negativo com os custos atuais." 
                            : clientPaybackMonths === 0
                            ? "Payback imediato (sem custo de setup ou mensalidade igual ao ganho)."
                            : `${clientPaybackMonths.toFixed(1)} meses`}
                      </p>
                    </div>
                  )}
                   <p className="text-xs text-muted-foreground pt-2">
                    Valores estimados. Considere a economia/ganho real do cliente e negocie.
                  </p>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && setupFee === null && (
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
  );
}
