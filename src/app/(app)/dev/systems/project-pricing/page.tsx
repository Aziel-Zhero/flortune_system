
// src/app/(app)/dev/systems/project-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, Percent, Clock, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";

const pricingSchema = z.object({
  hourlyRate: z.preprocess(val => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")), z.number().positive("Valor por hora deve ser positivo.")),
  estimatedHours: z.preprocess(val => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")), z.number().positive("Horas estimadas devem ser positivas.")),
  complexity: z.enum(["baixa", "media", "alta"], { required_error: "Selecione a complexidade."}),
  taxesOrPlatformFee: z.preprocess(val => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")), z.number().min(0, "Taxas não podem ser negativas.")),
  profitMargin: z.preprocess(val => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")), z.number().min(0, "Margem de lucro não pode ser negativa.").max(100, "Margem de lucro não pode ser maior que 100%.")),
});

type PricingFormData = z.infer<typeof pricingSchema>;

const complexityFactors = {
  baixa: 1.0,
  media: 1.25,
  alta: 1.5,
};

export default function ProjectPricingPage() {
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const { control, handleSubmit, register, formState: { errors } } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      hourlyRate: 50,
      estimatedHours: 10,
      complexity: "media",
      taxesOrPlatformFee: 0,
      profitMargin: 20,
    }
  });

  useEffect(() => {
    document.title = `Precificação de Projetos - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<PricingFormData> = (data) => {
    try {
      const baseCost = data.hourlyRate * data.estimatedHours;
      const complexityFactor = complexityFactors[data.complexity];
      const costWithComplexity = baseCost * complexityFactor;
      const profitAmount = costWithComplexity * (data.profitMargin / 100);
      const finalPrice = costWithComplexity + data.taxesOrPlatformFee + profitAmount;
      setTotalPrice(finalPrice);
       toast({ title: "Cálculo Realizado", description: "O preço total do projeto foi calculado."});
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o preço.", variant: "destructive"});
      setTotalPrice(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Precificação de Projetos (Freelancer)"
        description="Calcule o preço ideal para seus projetos com base em valor/hora, complexidade e custos."
        icon={<Calculator className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Parâmetros do Projeto</CardTitle>
            <CardDescription>
              Insira os detalhes para estimar o custo e preço do seu projeto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="hourlyRate" type="number" step="0.01" placeholder="Ex: 75,50" {...register("hourlyRate")} className="pl-10" />
                </div>
                {errors.hourlyRate && <p className="text-sm text-destructive mt-1">{errors.hourlyRate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                 <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="estimatedHours" type="number" step="0.5" placeholder="Ex: 40" {...register("estimatedHours")} className="pl-10" />
                </div>
                {errors.estimatedHours && <p className="text-sm text-destructive mt-1">{errors.estimatedHours.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Nível de Complexidade</Label>
              <Controller
                name="complexity"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="complexity">
                      <SelectValue placeholder="Selecione a complexidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa (Fator: {complexityFactors.baixa.toFixed(2)})</SelectItem>
                      <SelectItem value="media">Média (Fator: {complexityFactors.media.toFixed(2)})</SelectItem>
                      <SelectItem value="alta">Alta (Fator: {complexityFactors.alta.toFixed(2)})</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.complexity && <p className="text-sm text-destructive mt-1">{errors.complexity.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxesOrPlatformFee">Taxas / Custos Fixos (R$)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="taxesOrPlatformFee" type="number" step="0.01" placeholder="Ex: 50,00" {...register("taxesOrPlatformFee")} className="pl-10" />
                </div>
                {errors.taxesOrPlatformFee && <p className="text-sm text-destructive mt-1">{errors.taxesOrPlatformFee.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                 <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="profitMargin" type="number" step="1" placeholder="Ex: 20" {...register("profitMargin")} className="pl-10" />
                </div>
                {errors.profitMargin && <p className="text-sm text-destructive mt-1">{errors.profitMargin.message}</p>}
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            <Button type="submit" className="w-full md:w-auto">Calcular Preço do Projeto</Button>
            {totalPrice !== null && (
              <Card className="w-full bg-primary/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-primary font-headline text-lg">Preço Total Estimado do Projeto:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    R$ <PrivateValue value={totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este é um valor estimado. Ajuste os parâmetros conforme necessário.
                  </p>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && !totalPrice && (
                <div className="w-full p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                    <AlertCircle size={18} /> Por favor, corrija os erros no formulário para calcular.
                </div>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
