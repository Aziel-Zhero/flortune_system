// src/app/(app)/dev/systems/project-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, ClockIcon, Percent, AlertCircle, BarChartHorizontalBig } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const pricingSchema = z.object({
  hourlyRate: z.coerce.number().positive("Valor/hora deve ser positivo."),
  estimatedHours: z.coerce.number().positive("Horas estimadas devem ser positivas."),
  complexity: z.enum(["low", "medium", "high"], {required_error: "Selecione a complexidade."}),
  additionalFees: z.coerce.number().min(0, "Taxas não podem ser negativas."),
  profitMargin: z.coerce.number().min(0, "Margem não pode ser negativa.").max(100, "Margem máxima de 100%."),
});

type PricingFormData = z.infer<typeof pricingSchema>;

const complexityFactors = { low: 1.0, medium: 1.25, high: 1.5 };

export default function ProjectPricingPage() {
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
        complexity: "medium",
        profitMargin: 20
    }
  });

  useEffect(() => {
    document.title = `Orçamento de Projeto Tech - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<PricingFormData> = (data) => {
    try {
      const baseCost = data.hourlyRate * data.estimatedHours;
      const complexityFactor = complexityFactors[data.complexity];
      const costWithComplexity = baseCost * complexityFactor;
      const costPlusFees = costWithComplexity + data.additionalFees;
      const profitAmount = costPlusFees * (data.profitMargin / 100);
      const finalPrice = costPlusFees + profitAmount;
      
      setTotalPrice(finalPrice);
      toast({ title: "Cálculo Realizado", description: "O preço do projeto foi estimado com sucesso."});
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o preço.", variant: "destructive"});
      setTotalPrice(null);
    }
  };

  const handleReset = () => {
      reset({
          hourlyRate: undefined,
          estimatedHours: undefined,
          complexity: "medium",
          additionalFees: undefined,
          profitMargin: 20,
      });
      setTotalPrice(null);
  }

  return (
    <div>
      <PageHeader
        title="Orçamento de Projeto Tech"
        description="Calcule o preço estimado de um sistema baseado em escopo, tempo e complexidade."
        icon={<Calculator className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Parâmetros do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="hourlyRate">Seu Valor/Hora (R$)</Label>
                 <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="hourlyRate" type="number" step="0.01" placeholder="Ex: 100" {...register("hourlyRate")} className="pl-10" />
                 </div>
                 {errors.hourlyRate && <p className="text-sm text-destructive mt-1">{errors.hourlyRate.message}</p>}
               </div>
               <div className="space-y-2">
                 <Label htmlFor="estimatedHours">Horas Estimadas para o Projeto</Label>
                 <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="estimatedHours" type="number" step="1" placeholder="Ex: 40" {...register("estimatedHours")} className="pl-10" />
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
                     <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="complexity"><SelectValue placeholder="Selecione a complexidade" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Baixa (Fator x1.0)</SelectItem>
                            <SelectItem value="medium">Média (Fator x1.25)</SelectItem>
                            <SelectItem value="high">Alta (Fator x1.5)</SelectItem>
                        </SelectContent>
                    </Select>
                  )}
              />
              {errors.complexity && <p className="text-sm text-destructive mt-1">{errors.complexity.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additionalFees">Taxas Adicionais (R$)</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="additionalFees" type="number" step="0.01" placeholder="Ex: 150" {...register("additionalFees")} className="pl-10" />
                </div>
                {errors.additionalFees && <p className="text-sm text-destructive mt-1">{errors.additionalFees.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Margem de Lucro Desejada (%)</Label>
                <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="profitMargin" type="number" step="1" placeholder="Ex: 20" {...register("profitMargin")} className="pl-10" />
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
            {totalPrice !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Preço Sugerido para o Projeto:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    <PrivateValue value={totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  </p>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && totalPrice === null && (
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
