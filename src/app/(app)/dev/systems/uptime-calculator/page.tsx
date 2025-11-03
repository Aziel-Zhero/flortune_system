
// src/app/(app)/dev/systems/uptime-calculator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServerCog, AlertCircle, BarChartHorizontalBig, HelpCircle, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";

const uptimeSchema = z.object({
  slaPercentage: z.coerce.number({invalid_type_error: "Deve ser um número"})
    .min(0, "SLA não pode ser menor que 0%")
    .max(100, "SLA não pode ser maior que 100%"),
});

type UptimeFormData = z.infer<typeof uptimeSchema>;

interface DowntimeResult {
  yearly: string;
  monthly: string;
  weekly: string;
  daily: string;
}

export default function UptimeCalculatorPage() {
  const [downtime, setDowntime] = useState<DowntimeResult | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UptimeFormData>({
    resolver: zodResolver(uptimeSchema),
    defaultValues: {
        slaPercentage: 99.9,
    }
  });

  useEffect(() => {
    document.title = `Calculadora de Uptime (SLA) - ${APP_NAME}`;
  }, []);

  const formatDowntime = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "0 segundos";
    if (totalSeconds < 60) return `${totalSeconds.toFixed(2)} segundos`;
    const minutes = totalSeconds / 60;
    if (minutes < 60) return `${minutes.toFixed(2)} minutos`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(2)} horas`;
    const days = hours / 24;
    return `${days.toFixed(2)} dias`;
  };

  const onSubmit: SubmitHandler<UptimeFormData> = (data) => {
    try {
      const downtimePercentage = 100 - data.slaPercentage;
      const secondsInYear = 365.25 * 24 * 60 * 60;
      
      const yearlyDowntimeSeconds = secondsInYear * (downtimePercentage / 100);
      const monthlyDowntimeSeconds = yearlyDowntimeSeconds / 12;
      const weeklyDowntimeSeconds = yearlyDowntimeSeconds / 52.1775;
      const dailyDowntimeSeconds = yearlyDowntimeSeconds / 365.25;

      setDowntime({
        yearly: formatDowntime(yearlyDowntimeSeconds),
        monthly: formatDowntime(monthlyDowntimeSeconds),
        weekly: formatDowntime(weeklyDowntimeSeconds),
        daily: formatDowntime(dailyDowntimeSeconds),
      });
      toast({ title: "Cálculo de Uptime Realizado", description: "O tempo de inatividade foi calculado." });
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o uptime.", variant: "destructive" });
      setDowntime(null);
    }
  };
  
  const handleReset = () => {
    reset();
    setDowntime(null);
  }

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
      <div>
        <PageHeader
          title="Calculadora de Uptime (SLA)"
          description="Calcule o tempo de inatividade permitido com base em uma porcentagem de SLA."
          icon={<ServerCog className="h-6 w-6 text-primary" />}
          actions={<Button asChild variant="outline"><Link href="/dev/systems"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>}
        />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle className="font-headline">Parâmetros do SLA</CardTitle>
                  <DialogTrigger asChild><Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5 text-muted-foreground"/></Button></DialogTrigger>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="slaPercentage">Percentual de Uptime do SLA (%)</Label>
                <Input id="slaPercentage" type="number" step="0.001" placeholder="Ex: 99.9" {...register("slaPercentage")} />
                {errors.slaPercentage && <p className="text-sm text-destructive mt-1">{errors.slaPercentage.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <div className="flex gap-2">
                  <Button type="submit">Calcular Downtime</Button>
                  <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
              </div>
              
              {downtime && (
                <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Tempo de Inatividade Permitido:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                      <p><strong>Anual:</strong> {downtime.yearly}</p>
                      <p><strong>Mensal (aprox.):</strong> {downtime.monthly}</p>
                      <p><strong>Semanal (aprox.):</strong> {downtime.weekly}</p>
                      <p><strong>Diário (aprox.):</strong> {downtime.daily}</p>
                  </CardContent>
                </Card>
              )}
              {Object.keys(errors).length > 0 && downtime === null && (
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
       <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Fórmula e Explicação</DialogTitle>
          <DialogDescription>
            Entenda como o tempo de inatividade (downtime) é calculado a partir de uma porcentagem de SLA (Service Level Agreement).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p>O cálculo é feito para determinar quanto tempo, em unidades práticas (dias, horas, minutos), um serviço pode ficar indisponível sem violar o acordo de nível de serviço.</p>
          <div className="p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto">
            <p className="font-bold">Downtime % =</p>
            <p className="ml-2">100 - % de Uptime do SLA</p>
            <br />
            <p className="font-bold">Segundos de Downtime no Período =</p>
            <p className="ml-2">Total de Segundos no Período × (Downtime % / 100)</p>
          </div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>**Período Anual:** Considera 365.25 dias para levar em conta os anos bissextos.</li>
            <li>**Período Mensal:** É uma aproximação dividindo o total anual por 12.</li>
          </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Entendi</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
