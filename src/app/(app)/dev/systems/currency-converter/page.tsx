
// src/app/(app)/dev/systems/currency-converter/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Repeat, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { convertCurrency } from "@/app/actions/conversion.actions";

const currencySchema = z.object({
  fromCurrency: z.string().min(3, "Selecione a moeda de origem.").max(3),
  toCurrency: z.string().min(3, "Selecione a moeda de destino.").max(3),
  amount: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive("O valor deve ser positivo."),
}).refine(data => data.fromCurrency !== data.toCurrency, {
  message: "As moedas de origem e destino devem ser diferentes.",
  path: ["toCurrency"],
});

type CurrencyFormData = z.infer<typeof currencySchema>;

const commonCurrencies = [
  { code: "BRL", name: "Real Brasileiro" },
  { code: "USD", name: "Dólar Americano" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Libra Esterlina" },
  { code: "JPY", name: "Iene Japonês" },
  { code: "ARS", name: "Peso Argentino"},
  { code: "CAD", name: "Dólar Canadense"},
  { code: "AUD", name: "Dólar Australiano"},
  { code: "CHF", name: "Franco Suíço"},
  { code: "CNY", name: "Yuan Chinês"},
];

export default function CurrencyConverterPage() {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<string | null>(null);
  const [conversionDate, setConversionDate] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, register, formState: { errors }, watch, setValue, getValues } = useForm<CurrencyFormData>({
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

  const onSubmit: SubmitHandler<CurrencyFormData> = async (data) => {
    setIsConverting(true);
    setApiError(null);
    setConvertedAmount(null);
    setConversionRate(null);
    setConversionDate(null);

    const result = await convertCurrency(data.amount, data.fromCurrency, data.toCurrency);

    if (result.error) {
      setApiError(result.error);
      toast({ title: "Erro na Conversão", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setConvertedAmount(result.data.convertedAmount);
      setConversionRate(`1 ${data.fromCurrency} ≈ ${result.data.rate.toFixed(4)} ${data.toCurrency}`);
      setConversionDate(new Date(result.data.date).toLocaleDateString('pt-BR', {year: 'numeric', month: 'long', day: 'numeric'}));
      toast({ title: "Conversão Realizada!", description: `Cotação de ${new Date(result.data.date).toLocaleDateString('pt-BR')}.` });
    }
    setIsConverting(false);
  };

  const handleInvertCurrencies = () => {
    const currentFrom = getValues("fromCurrency");
    const currentTo = getValues("toCurrency");
    setValue("fromCurrency", currentTo);
    setValue("toCurrency", currentFrom);
  };

  return (
    <div>
      <PageHeader
        title="Conversor de Moeda"
        description="Converta valores entre diferentes moedas com cotações atualizadas."
        icon={<Coins className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes da Conversão</CardTitle>
            <CardDescription>
              Selecione as moedas e insira o valor. Cotações fornecidas por <a href="https://exchangerate.host" target="_blank" rel="noopener noreferrer" className="underline text-primary">ExchangeRate.host</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-6 items-end">
              <div className="space-y-2">
                <Label htmlFor="fromCurrency">De:</Label>
                <Controller
                  name="fromCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="fromCurrency"><SelectValue placeholder="Moeda Origem" /></SelectTrigger>
                      <SelectContent>{commonCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                 {errors.fromCurrency && <p className="text-sm text-destructive mt-1">{errors.fromCurrency.message}</p>}
              </div>
              
              <div className="flex justify-center">
                <Button type="button" variant="ghost" size="icon" aria-label="Inverter moedas" onClick={handleInvertCurrencies} className="h-10 w-10">
                    <Repeat className="h-5 w-5 text-muted-foreground"/>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toCurrency">Para:</Label>
                <Controller
                  name="toCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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
            <Button type="submit" className="w-full md:w-auto" disabled={isConverting}>
                {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isConverting ? "Convertendo..." : "Converter Moeda"}
            </Button>
            {apiError && (
                 <Alert variant="destructive" className="w-full">
                    <AlertCircle size={18} className="h-4 w-4" />
                    <AlertTitle>Erro na API</AlertTitle>
                    <AlertDescription>{apiError}</AlertDescription>
                </Alert>
            )}
            {convertedAmount !== null && watchedFromCurrency && watchedToCurrency && !apiError && (
              <Card className="w-full bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md">Resultado da Conversão:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                     <PrivateValue value={convertedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                     <span className="text-lg ml-1">{watchedToCurrency}</span>
                  </p>
                  {conversionRate && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Taxa de conversão: {conversionRate}
                    </p>
                  )}
                   {conversionDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Cotação de: {conversionDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
