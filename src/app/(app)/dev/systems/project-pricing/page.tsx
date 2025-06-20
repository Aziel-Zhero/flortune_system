
// src/app/(app)/dev/systems/project-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, Percent, Clock, AlertCircle, BarChartHorizontalBig } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const pricingSchema = z.object({
  estimatedHours: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Horas estimadas devem ser positivas."),
  hourlyRate: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Valor por hora deve ser positivo."),
  toolCost: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Custo não pode ser negativo.").optional().default(0),
  profitMargin: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Margem não pode ser negativa.").max(100, "Máximo 100%").optional().default(30),
});

type PricingFormData = z.infer<typeof pricingSchema>;

export default function ProjectPricingFreelancerPage() {
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [minimumPrice, setMinimumPrice] = useState<number | null>(null);
  const [effectiveHourlyRate, setEffectiveHourlyRate] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      profitMargin: 30,
      toolCost: 0,
    }
  });

  useEffect(() => {
    document.title = `Precificação Freelancer (Simples) - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<PricingFormData> = (data) => {
    try {
      const baseCost = data.estimatedHours * data.hourlyRate;
      const costWithTools = baseCost + (data.toolCost || 0);
      
      const minPrice = costWithTools; // Preço sem margem de lucro
      
      const profit = costWithTools * (data.profitMargin / 100);
      const suggPrice = costWithTools + profit;
      const effHourlyRate = suggPrice / data.estimatedHours;

      setMinimumPrice(minPrice);
      setSuggestedPrice(suggPrice);
      setEffectiveHourlyRate(effHourlyRate);

      toast({ title: "Cálculo Realizado", description: "Preços e taxas foram calculados."});
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular os preços.", variant: "destructive"});
      setSuggestedPrice(null);
      setMinimumPrice(null);
      setEffectiveHourlyRate(null);
    }
  };

  const handleReset = () => {
    reset({
        hourlyRate: undefined,
        estimatedHours: undefined,
        toolCost: 0,
        profitMargin: 30,
    });
    setSuggestedPrice(null);
    setMinimumPrice(null);
    setEffectiveHourlyRate(null);
  }

  return (
    <div>
      <PageHeader
        title="Precificação Freelancer (Simples)"
        description="Calcule preços para projetos com base em horas, valor/hora, custos e margem de lucro."
        icon={<Calculator className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Parâmetros do Projeto</CardTitle>
            <CardDescription>
              Insira os detalhes para estimar o custo e preço do seu projeto freelancer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas por Tarefa/Projeto</Label>
                 <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="estimatedHours" type="number" step="0.5" placeholder="Ex: 20" {...register("estimatedHours")} className="pl-10" />
                </div>
                {errors.estimatedHours && <p className="text-sm text-destructive mt-1">{errors.estimatedHours.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Seu Valor por Hora (R$)</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="hourlyRate" type="number" step="0.01" placeholder="Ex: 75,50" {...register("hourlyRate")} className="pl-10" />
                </div>
                {errors.hourlyRate && <p className="text-sm text-destructive mt-1">{errors.hourlyRate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toolCost">Custo de Ferramentas/Recursos (R$, opcional)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="toolCost" type="number" step="0.01" placeholder="Ex: 50,00" {...register("toolCost")} className="pl-10" />
                </div>
                {errors.toolCost && <p className="text-sm text-destructive mt-1">{errors.toolCost.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Margem de Lucro Desejada (%)</Label>
                 <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="profitMargin" type="number" step="1" placeholder="Ex: 30" {...register("profitMargin")} className="pl-10" />
                </div>
                {errors.profitMargin && <p className="text-sm text-destructive mt-1">{errors.profitMargin.message}</p>}
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button type="submit">Calcular Preço</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {(suggestedPrice !== null || minimumPrice !== null) && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Resultados da Precificação:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestedPrice !== null && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Preço Sugerido (com lucro):</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ <PrivateValue value={suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </p>
                    </div>
                  )}
                  {minimumPrice !== null && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Preço Mínimo (sem lucro):</p>
                      <p className="text-lg font-semibold">
                        R$ <PrivateValue value={minimumPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </p>
                    </div>
                  )}
                  {effectiveHourlyRate !== null && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor por Hora Efetivo (com lucro):</p>
                      <p className="text-lg font-semibold">
                        R$ <PrivateValue value={effectiveHourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /> / hora
                      </p>
                    </div>
                  )}
                   <p className="text-xs text-muted-foreground pt-2">
                    Estes são valores estimados. Ajuste os parâmetros conforme sua realidade e negociação.
                  </p>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && suggestedPrice === null && (
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
