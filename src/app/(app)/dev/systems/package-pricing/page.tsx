
// src/app/(app)/dev/systems/package-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Percent, DollarSign, Clock, Briefcase, AlertCircle, BarChartHorizontalBig } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const packagePricingSchema = z.object({
  planName: z.string().min(2, "Nome do plano é obrigatório.").optional().default("Meu Pacote"),
  includedHours: z.coerce.number().min(0, "Horas não podem ser negativas."),
  hourlyRateForPackage: z.coerce.number().min(0, "Valor/hora não pode ser negativo."),
  toolInfrastructureCost: z.coerce.number().min(0, "Custo não pode ser negativo."),
  profitMargin: z.coerce.number().min(0, "Margem não pode ser negativa.").max(100, "Máximo 100%"),
  extraHourRate: z.coerce.number().min(0, "Valor não pode ser negativo."),
});

type PackagePricingFormData = z.infer<typeof packagePricingSchema>;

export default function PackagePricingPage() {
  const [planPrice, setPlanPrice] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PackagePricingFormData>({
    resolver: zodResolver(packagePricingSchema),
    defaultValues: {
        planName: "Pacote de Manutenção",
        includedHours: 10,
        hourlyRateForPackage: 50,
        toolInfrastructureCost: 25,
        profitMargin: 30,
        extraHourRate: 75,
    }
  });

  useEffect(() => {
    document.title = `Precificação de Pacotes/Assinaturas - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<PackagePricingFormData> = (data) => {
    try {
      const costOfHours = data.includedHours * data.hourlyRateForPackage;
      const totalBaseCost = costOfHours + data.toolInfrastructureCost;
      const profit = totalBaseCost * (data.profitMargin / 100);
      const calculatedPlanPrice = totalBaseCost + profit;
      
      setPlanPrice(calculatedPlanPrice);

      toast({ title: "Cálculo Realizado", description: "Preço do pacote/assinatura calculado."});
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o preço do pacote.", variant: "destructive"});
      setPlanPrice(null);
    }
  };

  const handleReset = () => {
    reset();
    setPlanPrice(null);
  }

  return (
    <div>
      <PageHeader
        title="Calculadora de Precificação de Pacotes e Assinaturas"
        description="Estruture preços para serviços recorrentes, pacotes de horas ou entregas mensais."
        icon={<Briefcase className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Pacote/Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="planName">Nome do Plano/Pacote</Label>
              <Input id="planName" {...register("planName")} placeholder="Ex: Pacote Pro de Manutenção" />
              {errors.planName && <p className="text-sm text-destructive mt-1">{errors.planName.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="includedHours">Nº de Horas Inclusas</Label>
                <div className="relative">
                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="includedHours" type="number" step="1" placeholder="Ex: 10" {...register("includedHours")} className="pl-10" />
                </div>
                {errors.includedHours && <p className="text-sm text-destructive mt-1">{errors.includedHours.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRateForPackage">Valor/Hora Base para o Pacote (R$)</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="hourlyRateForPackage" type="number" step="0.01" placeholder="Ex: 50" {...register("hourlyRateForPackage")} className="pl-10" />
                </div>
                {errors.hourlyRateForPackage && <p className="text-sm text-destructive mt-1">{errors.hourlyRateForPackage.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="toolInfrastructureCost">Custo Ferramentas/Infra Mensal (R$)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="toolInfrastructureCost" type="number" step="0.01" placeholder="Ex: 25" {...register("toolInfrastructureCost")} className="pl-10" />
                    </div>
                    {errors.toolInfrastructureCost && <p className="text-sm text-destructive mt-1">{errors.toolInfrastructureCost.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="profitMargin">Margem de Lucro Desejada (%)</Label>
                    <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="profitMargin" type="number" step="1" placeholder="Ex: 30" {...register("profitMargin")} className="pl-10" />
                    </div>
                    {errors.profitMargin && <p className="text-sm text-destructive mt-1">{errors.profitMargin.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="extraHourRate">Valor Hora Extra (R$)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="extraHourRate" type="number" step="0.01" placeholder="Ex: 75" {...register("extraHourRate")} className="pl-10" />
                    </div>
                    {errors.extraHourRate && <p className="text-sm text-destructive mt-1">{errors.extraHourRate.message}</p>}
                </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button type="submit">Calcular Preço do Plano</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {planPrice !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Resultados da Precificação do Plano:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Preço Sugerido do Plano/Pacote:</p>
                      <p className="text-xl font-bold text-primary">
                        R$ <PrivateValue value={planPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /> / mês
                      </p>
                    </div>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && planPrice === null && (
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
