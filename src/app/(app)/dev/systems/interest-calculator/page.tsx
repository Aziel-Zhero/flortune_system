
// src/app/(app)/dev/systems/interest-calculator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PercentSquare, DollarSign, ClockIcon, AlertCircle, BarChartHorizontalBig, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const interestType = ["simples", "composto"] as const;
const timePeriodUnit = ["meses", "anos"] as const;
const ratePeriodUnit = ["mensal", "anual"] as const;

const interestSchema = z.object({
  type: z.enum(interestType, {required_error: "Selecione o tipo de juros."}),
  initialCapital: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Capital inicial deve ser positivo."),
  rate: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Taxa deve ser positiva."),
  ratePeriod: z.enum(ratePeriodUnit, {required_error: "Selecione o período da taxa."}),
  time: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Tempo deve ser positivo."),
  timePeriod: z.enum(timePeriodUnit, {required_error: "Selecione o período do tempo."}),
});

type InterestFormData = z.infer<typeof interestSchema>;

export default function InterestCalculatorPage() {
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<InterestFormData>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
        type: "composto",
        ratePeriod: "anual",
        timePeriod: "anos",
    }
  });

  useEffect(() => {
    document.title = `Calculadora de Juros - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<InterestFormData> = (data) => {
    try {
        let i = data.rate / 100; // Taxa em decimal
        let t = data.time;

        // Converter taxa e tempo para a mesma unidade (meses)
        if (data.ratePeriod === "anual") i = i / 12; // Taxa mensal
        if (data.timePeriod === "anos") t = t * 12; // Tempo em meses

        let finalAmount: number;
        if (data.type === "simples") {
            // J = C * i * t  => M = C + J = C * (1 + i * t)
            finalAmount = data.initialCapital * (1 + i * t);
        } else { // composto
            // M = C * (1 + i)^t
            finalAmount = data.initialCapital * Math.pow((1 + i), t);
        }
        
        setTotalAmount(finalAmount);
        setTotalInterest(finalAmount - data.initialCapital);
        toast({ title: "Cálculo de Juros Realizado", description: "O montante e os juros foram calculados." });

    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular os juros.", variant: "destructive" });
      setTotalAmount(null);
      setTotalInterest(null);
    }
  };

  const handleReset = () => {
    reset();
    setTotalAmount(null);
    setTotalInterest(null);
  }

  return (
    <div>
      <PageHeader
        title="Calculadora de Juros (Simples e Compostos)"
        description="Simule o crescimento de capital com juros simples ou compostos."
        icon={<PercentSquare className="h-6 w-6 text-primary" />}
      />
       <Card className="mb-6">
        <CardHeader className="bg-amber-500/10 border-b border-amber-500/30">
          <CardTitle className="font-headline text-amber-700 dark:text-amber-400 flex items-center"><Construction className="mr-2 h-5 w-5"/>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription className="text-amber-600 dark:text-amber-500">
            Valores são calculados com base na conversão de taxas e períodos para meses.
          </CardDescription>
        </CardHeader>
      </Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Parâmetros do Cálculo de Juros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de Juros</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="simples" id="simples" /><Label htmlFor="simples" className="font-normal">Simples</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="composto" id="composto" /><Label htmlFor="composto" className="font-normal">Composto</Label></div>
                  </RadioGroup>
                )}
              />
              {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialCapital">Capital Inicial (R$)</Label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input id="initialCapital" type="number" step="0.01" placeholder="Ex: 1000" {...register("initialCapital")} className="pl-10" />
              </div>
              {errors.initialCapital && <p className="text-sm text-destructive mt-1">{errors.initialCapital.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Taxa de Juros (%)</Label>
                <div className="relative">
                   <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="rate" type="number" step="0.01" placeholder="Ex: 1.5" {...register("rate")} className="pl-10" />
                </div>
                 {errors.rate && <p className="text-sm text-destructive mt-1">{errors.rate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ratePeriod">Período da Taxa</Label>
                <Controller name="ratePeriod" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="ratePeriod"><SelectValue placeholder="Período da Taxa" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                )}/>
                {errors.ratePeriod && <p className="text-sm text-destructive mt-1">{errors.ratePeriod.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Tempo</Label>
                 <div className="relative">
                   <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="time" type="number" step="1" placeholder="Ex: 12" {...register("time")} className="pl-10" />
                </div>
                {errors.time && <p className="text-sm text-destructive mt-1">{errors.time.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timePeriod">Período do Tempo</Label>
                 <Controller name="timePeriod" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="timePeriod"><SelectValue placeholder="Período do Tempo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meses">Meses</SelectItem>
                        <SelectItem value="anos">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                )}/>
                {errors.timePeriod && <p className="text-sm text-destructive mt-1">{errors.timePeriod.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
             <div className="flex gap-2">
                <Button type="submit">Calcular Juros</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {(totalAmount !== null || totalInterest !== null) && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Resultados do Cálculo:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {totalAmount !== null && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Montante Final:</p>
                      <p className="text-xl font-bold text-primary">
                        R$ <PrivateValue value={totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </p>
                    </div>
                  )}
                  {totalInterest !== null && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Juros Gerados:</p>
                      <p className="text-lg font-semibold">
                        R$ <PrivateValue value={totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && totalAmount === null && (
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
