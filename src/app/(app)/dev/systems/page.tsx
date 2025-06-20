
// src/app/(app)/dev/systems/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calculator, Component, DollarSign, Percent, Clock, BarChartHorizontalBig, Globe, Settings2 as SettingsIcon } from "lucide-react"; // Renomeado Settings2 para evitar conflito
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema para Calculadora de Precificação
const pricingSchema = z.object({
  hourlyRate: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Valor por hora deve ser positivo"),
  estimatedHours: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Horas estimadas devem ser positivas"),
  complexity: z.enum(["low", "medium", "high"], {required_error: "Selecione a complexidade"}),
  taxesPercent: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Não pode ser negativo").max(100, "Máximo 100%").optional().default(0),
  platformFeeFixed: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Não pode ser negativo").optional().default(0),
  profitMarginPercent: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(0, "Não pode ser negativo").max(100, "Máximo 100%").optional().default(0),
});
type PricingFormData = z.infer<typeof pricingSchema>;

const complexityFactors: Record<PricingFormData['complexity'], number> = {
  low: 1.0,
  medium: 1.25,
  high: 1.5,
};

export default function DevSystemsPage() {
  useEffect(() => {
    document.title = `Sistemas e Ferramentas (DEV) - ${APP_NAME}`;
  }, []);

  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const { control, handleSubmit, register, formState: { errors }, reset: resetPricingForm } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      complexity: "medium",
      taxesPercent: 0,
      platformFeeFixed: 0,
      profitMarginPercent: 0,
      hourlyRate: undefined, // Para que o placeholder apareça
      estimatedHours: undefined,
    },
  });

  const onSubmitPricing = (data: PricingFormData) => {
    const baseCost = data.hourlyRate * data.estimatedHours;
    const complexityFactor = complexityFactors[data.complexity];
    const costWithComplexity = baseCost * complexityFactor;
    
    const taxesAmount = costWithComplexity * (data.taxesPercent! / 100); // ! pois tem default
    const totalBeforeProfit = costWithComplexity + taxesAmount + data.platformFeeFixed!; // ! pois tem default
    const profitAmount = totalBeforeProfit * (data.profitMarginPercent! / 100); // ! pois tem default
    const finalPrice = totalBeforeProfit + profitAmount;

    setTotalPrice(finalPrice);
  };

  return (
    <div>
      <PageHeader
        title="Sistemas e Ferramentas (DEV)"
        description="Calculadoras e utilitários para desenvolvedores e freelancers."
        icon={<SettingsIcon className="h-6 w-6 text-primary" />} // Usando o ícone renomeado
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calculadora de Precificação de Projetos */}
        <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Calculadora de Precificação de Projetos (Freelancer)
            </CardTitle>
            <CardDescription>Calcule o preço ideal para seus projetos freelancer com base em valor/hora, complexidade e taxas.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmitPricing)}>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="hourlyRate">Valor/Hora (R$)</Label>
                  <Input id="hourlyRate" type="number" step="0.01" placeholder="Ex: 75,50" {...register("hourlyRate")} />
                  {errors.hourlyRate && <p className="text-xs text-destructive mt-1">{errors.hourlyRate.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                  <Input id="estimatedHours" type="number" placeholder="Ex: 40" {...register("estimatedHours")} />
                  {errors.estimatedHours && <p className="text-xs text-destructive mt-1">{errors.estimatedHours.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="complexity">Complexidade</Label>
                  <Controller
                    name="complexity"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="complexity"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa (x1.0)</SelectItem>
                          <SelectItem value="medium">Média (x1.25)</SelectItem>
                          <SelectItem value="high">Alta (x1.5)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                   {errors.complexity && <p className="text-xs text-destructive mt-1">{errors.complexity.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="taxesPercent">Impostos (%)</Label>
                  <Input id="taxesPercent" type="number" step="0.1" placeholder="Ex: 6" {...register("taxesPercent")} />
                  {errors.taxesPercent && <p className="text-xs text-destructive mt-1">{errors.taxesPercent.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="platformFeeFixed">Taxa Plataforma (Fixo R$)</Label>
                  <Input id="platformFeeFixed" type="number" step="0.01" placeholder="Ex: 0" {...register("platformFeeFixed")} />
                  {errors.platformFeeFixed && <p className="text-xs text-destructive mt-1">{errors.platformFeeFixed.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profitMarginPercent">Margem Lucro (%)</Label>
                  <Input id="profitMarginPercent" type="number" step="0.1" placeholder="Ex: 20" {...register("profitMarginPercent")} />
                  {errors.profitMarginPercent && <p className="text-xs text-destructive mt-1">{errors.profitMarginPercent.message}</p>}
                </div>
              </div>
              {totalPrice !== null && (
                <Alert className="mt-6 bg-primary/5 border-primary/20">
                  <DollarSign className="h-5 w-5 !text-primary" />
                  <AlertTitle className="font-headline text-primary text-md">Preço Total Estimado do Projeto</AlertTitle>
                  <AlertDescription className="text-2xl font-bold text-primary">
                    {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="pt-2"> {/* Reduzido padding superior do footer */}
              <Button type="submit">
                <Calculator className="mr-2 h-4 w-4" /> Calcular Preço
              </Button>
              <Button type="button" variant="outline" className="ml-2" onClick={() => { resetPricingForm(); setTotalPrice(null); }}>
                Limpar
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Placeholders para Outras Calculadoras */}
        <Card className="opacity-60 hover:opacity-100 transition-opacity duration-300 shadow-sm">
          <CardHeader><CardTitle className="font-headline flex items-center text-md"><Globe className="mr-2 h-5 w-5 text-primary/70"/>Conversão de Moeda</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Converta valores entre diferentes moedas com cotações (API em breve).</p></CardContent>
          <CardFooter><Button variant="outline" disabled>Em breve</Button></CardFooter>
        </Card>
        <Card className="opacity-60 hover:opacity-100 transition-opacity duration-300 shadow-sm">
          <CardHeader><CardTitle className="font-headline flex items-center text-md"><Clock className="mr-2 h-5 w-5 text-primary/70"/>Conversor de Tempo</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Converta unidades de tempo (minutos, horas, dias, etc.).</p></CardContent>
          <CardFooter><Button variant="outline" disabled>Em breve</Button></CardFooter>
        </Card>
         <Card className="opacity-60 hover:opacity-100 transition-opacity duration-300 shadow-sm">
          <CardHeader><CardTitle className="font-headline flex items-center text-md"><Percent className="mr-2 h-5 w-5 text-primary/70"/>Juros Compostos/Simples</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Simule o crescimento de capital com juros simples ou compostos.</p></CardContent>
          <CardFooter><Button variant="outline" disabled>Em breve</Button></CardFooter>
        </Card>
         <Card className="opacity-60 hover:opacity-100 transition-opacity duration-300 shadow-sm">
          <CardHeader><CardTitle className="font-headline flex items-center text-md"><BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary/70"/>Calculadora de Uptime (SLA)</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Calcule o tempo de inatividade permitido para um SLA específico.</p></CardContent>
          <CardFooter><Button variant="outline" disabled>Em breve</Button></CardFooter>
        </Card>
      </div>
    </div>
  );
}

    