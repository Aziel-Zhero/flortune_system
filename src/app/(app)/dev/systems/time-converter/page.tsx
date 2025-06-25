// src/app/(app)/dev/systems/time-converter/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClockIcon, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const timeUnits = ["segundos", "minutos", "horas", "dias", "semanas", "meses"] as const;
type TimeUnit = typeof timeUnits[number];

const timeConversionSchema = z.object({
  value: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("Valor deve ser positivo."),
  fromUnit: z.enum(timeUnits, {required_error: "Selecione a unidade de origem."}),
  toUnit: z.enum(timeUnits, {required_error: "Selecione a unidade de destino."}),
});

type TimeConversionFormData = z.infer<typeof timeConversionSchema>;

const factorsToSeconds: Record<TimeUnit, number> = {
  segundos: 1,
  minutos: 60,
  horas: 3600,
  dias: 86400,
  semanas: 604800,
  meses: 2629800, // Aproximadamente 30.4375 dias
};

export default function TimeConverterPage() {
  const [convertedValue, setConvertedValue] = useState<string | null>(null);

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<TimeConversionFormData>({
    resolver: zodResolver(timeConversionSchema),
    defaultValues: {
        fromUnit: "horas",
        toUnit: "minutos",
    }
  });

  useEffect(() => {
    document.title = `Conversor de Tempo - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<TimeConversionFormData> = (data) => {
    try {
      const valueInSeconds = data.value * factorsToSeconds[data.fromUnit];
      const result = valueInSeconds / factorsToSeconds[data.toUnit];
      
      setConvertedValue(`${result.toLocaleString(undefined, {maximumFractionDigits: 4})} ${data.toUnit}`);
      toast({ title: "Conversão Realizada", description: "O tempo foi convertido com sucesso." });
    } catch (error) {
      toast({ title: "Erro na Conversão", description: "Não foi possível converter o tempo.", variant: "destructive" });
      setConvertedValue(null);
    }
  };
  
  const handleReset = () => {
    reset();
    setConvertedValue(null);
  }

  return (
    <div>
      <PageHeader
        title="Conversor de Tempo"
        description="Converta facilmente entre diferentes unidades de tempo."
        icon={<ClockIcon className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes da Conversão de Tempo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="value">Valor a Converter</Label>
              <Input id="value" type="number" step="any" placeholder="Ex: 1.5" {...register("value")} />
              {errors.value && <p className="text-sm text-destructive mt-1">{errors.value.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromUnit">De Unidade:</Label>
                <Controller
                  name="fromUnit"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="fromUnit"><SelectValue placeholder="Unidade de Origem" /></SelectTrigger>
                      <SelectContent>{timeUnits.map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                 {errors.fromUnit && <p className="text-sm text-destructive mt-1">{errors.fromUnit.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="toUnit">Para Unidade:</Label>
                <Controller
                  name="toUnit"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="toUnit"><SelectValue placeholder="Unidade de Destino" /></SelectTrigger>
                      <SelectContent>{timeUnits.map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.toUnit && <p className="text-sm text-destructive mt-1">{errors.toUnit.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button type="submit">Converter Tempo</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {convertedValue !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md">Resultado da Conversão:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                     {convertedValue}
                  </p>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && convertedValue === null && (
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
