
// src/app/(app)/dev/systems/package-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PercentSquare, DollarSign, Clock, Briefcase, AlertCircle, BarChartHorizontalBig, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const packagePricingSchema = z.object({
  planName: z.string().min(2, "Nome do plano é obrigatório.").optional().default("Meu Pacote"),
  includedHours: z.coerce.number().min(0, "Horas não podem ser negativas.").optional().default(0),
  hourlyRateForPackage: z.coerce.number().min(0, "Valor/hora não pode ser negativo.").optional().default(0),
  taskFrequency: z.string().optional(),
  toolInfrastructureCost: z.coerce.number().min(0, "Custo não pode ser negativo.").optional().default(0),
  profitMargin: z.coerce.number().min(0, "Margem não pode ser negativa.").max(100, "Máximo 100%").optional().default(30),
  extraHourRate: z.coerce.number().min(0, "Valor não pode ser negativo.").optional().default(0),
});

type PackagePricingFormData = z.infer<typeof packagePricingSchema>;

export default function PackagePricingPage() {
  const [planPrice, setPlanPrice] = useState<number | null>(null);
  const [clientSaving, setClientSaving] = useState<string | null>("Não calculado (necessita valor/hora avulso)");


  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<PackagePricingFormData>({
    resolver: zodResolver(packagePricingSchema),
    defaultValues: {
        planName: "Meu Pacote",
        includedHours: 10,
        hourlyRateForPackage: 50,
        toolInfrastructureCost: 0,
        profitMargin: 30,
        extraHourRate: 75,
        taskFrequency: "N/A"
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
      // Cálculo de "economia" é complexo sem uma taxa horária avulsa de referência. Deixando como placeholder.
      setClientSaving("Cálculo de economia requer taxa horária avulsa de referência.");

      toast({ title: "Cálculo Realizado", description: "Preço do pacote/assinatura calculado."});
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o preço do pacote.", variant: "destructive"});
      setPlanPrice(null);
      setClientSaving(null);
    }
  };

  const handleReset = () => {
    reset({
        planName: "Meu Pacote",
        includedHours: 10,
        hourlyRateForPackage: 50,
        toolInfrastructureCost: 0,
        profitMargin: 30,
        extraHourRate: 75,
        taskFrequency: "N/A"
    });
    setPlanPrice(null);
    setClientSaving(null);
  }

  return (
    <div>
      <PageHeader
        title="Calculadora de Precificação de Pacotes e Assinaturas"
        description="Estruture preços para serviços recorrentes, pacotes de horas ou entregas mensais."
        icon={<PercentSquare className="h-6 w-6 text-primary" />}
      />
      <Card className="mb-6">
        <CardHeader className="bg-amber-500/10 border-b border-amber-500/30">
          <CardTitle className="font-headline text-amber-700 dark:text-amber-400 flex items-center"><Construction className="mr-2 h-5 w-5"/>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription className="text-amber-600 dark:text-amber-500">
            Esta calculadora está em fase inicial. A lógica de "economia do cliente" e outros refinamentos serão adicionados.
          </CardDescription>
        </CardHeader>
      </Card>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="taskFrequency">Frequência de Tarefas (Opcional)</Label>
                <Input id="taskFrequency" {...register("taskFrequency")} placeholder="Ex: 2 ajustes/mês" />
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
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Economia Estimada para o Cliente:</p>
                      <p className="text-lg font-semibold">
                        {clientSaving}
                      </p>
                    </div>
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor Adicional por Hora Extra:</p>
                      <p className="text-lg font-semibold">
                        R$ <PrivateValue value={watch("extraHourRate")?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} />
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
