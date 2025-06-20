
// src/app/(app)/dev/systems/currency-converter/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Repeat, DollarSign } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";

const currencySchema = z.object({
  fromCurrency: z.string().min(3, "Selecione a moeda de origem.").max(3),
  toCurrency: z.string().min(3, "Selecione a moeda de destino.").max(3),
  amount: z.preprocess(val => Number(String(val).replace(/[^0-9,.-]+/g, "").replace(",", ".")), z.number().positive("O valor deve ser positivo.")),
}).refine(data => data.fromCurrency !== data.toCurrency, {
  message: "As moedas de origem e destino devem ser diferentes.",
  path: ["toCurrency"],
});

type CurrencyFormData = z.infer<typeof currencySchema>;

// Lista simplificada de moedas
const commonCurrencies = [
  { code: "BRL", name: "Real Brasileiro" },
  { code: "USD", name: "Dólar Americano" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Libra Esterlina" },
  { code: "JPY", name: "Iene Japonês" },
];

export default function CurrencyConverterPage() {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<string | null>(null);

  const { control, handleSubmit, register, formState: { errors }, watch } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      fromCurrency: "BRL",
      toCurrency: "USD",
      amount: 100,
    }
  });

  const watchedFromCurrency = watch("fromCurrency");
  const watchedToCurrency = watch("toCurrency");

  useEffect(() => {
    document.title = `Conversor de Moeda - ${APP_NAME}`;
  }, []);

  // Simulação de busca de taxa de câmbio e conversão
  const onSubmit: SubmitHandler<CurrencyFormData> = async (data) => {
    toast({ title: "Simulando Conversão...", description: "Esta é uma simulação. Nenhuma API real está sendo chamada." });
    // Simulação de uma taxa de câmbio
    let rate: number;
    if (data.fromCurrency === "BRL" && data.toCurrency === "USD") rate = 0.19; // Ex: 1 BRL = 0.19 USD
    else if (data.fromCurrency === "USD" && data.toCurrency === "BRL") rate = 5.25; // Ex: 1 USD = 5.25 BRL
    else if (data.fromCurrency === "EUR" && data.toCurrency === "USD") rate = 1.08;
    else if (data.fromCurrency === "USD" && data.toCurrency === "EUR") rate = 0.92;
    else rate = Math.random() * 10; // Taxa aleatória para outras conversões

    const result = data.amount * rate;
    setConvertedAmount(result);
    setConversionRate(`1 ${data.fromCurrency} ≈ ${rate.toFixed(4)} ${data.toCurrency}`);
  };

  return (
    <div>
      <PageHeader
        title="Conversor de Moeda"
        description="Converta valores entre diferentes moedas com cotações simuladas."
        icon={<Coins className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes da Conversão</CardTitle>
            <CardDescription>
              Selecione as moedas e insira o valor para conversão. (API não integrada, taxas simuladas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="fromCurrency">De:</Label>
                <Controller
                  name="fromCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="fromCurrency"><SelectValue placeholder="Moeda Origem" /></SelectTrigger>
                      <SelectContent>{commonCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                 {errors.fromCurrency && <p className="text-sm text-destructive mt-1">{errors.fromCurrency.message}</p>}
              </div>
              
              <div className="flex justify-center md:col-span-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Inverter moedas" onClick={() => alert("Inverter moedas (placeholder)")}>
                    <Repeat className="h-5 w-5 text-muted-foreground"/>
                </Button>
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="toCurrency">Para:</Label>
                <Controller
                  name="toCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="toCurrency"><SelectValue placeholder="Moeda Destino" /></SelectTrigger>
                      <SelectContent>{commonCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.toCurrency && <p className="text-sm text-destructive mt-1">{errors.toCurrency.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="amount">Valor a Converter</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="amount" type="number" step="0.01" placeholder="Ex: 100,00" {...register("amount")} className="pl-10" />
                </div>
                {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
            </div>
             {errors.root && <p className="text-sm text-destructive mt-1">{errors.root.message}</p>}

          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            <Button type="submit" className="w-full md:w-auto">Converter Moeda</Button>
            {convertedAmount !== null && watchedFromCurrency && watchedToCurrency && (
              <Card className="w-full bg-primary/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-primary font-headline text-lg">Resultado da Conversão:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                     <PrivateValue value={convertedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                     <span className="text-xl ml-1">{watchedToCurrency}</span>
                  </p>
                  {conversionRate && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Taxa de conversão simulada: {conversionRate}
                    </p>
                  )}
                   <p className="text-xs text-muted-foreground mt-1">
                    Atenção: Esta é uma simulação. As taxas de câmbio reais podem variar.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
