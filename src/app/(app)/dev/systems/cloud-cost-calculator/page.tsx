// src/app/(app)/dev/systems/cloud-cost-calculator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, AlertCircle, BarChartHorizontalBig, HelpCircle, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";
import { CurrencySelector } from "@/components/shared/currency-selector";

const cloudCostSchema = z.object({
  vps: z.coerce.number().min(0, "Custo não pode ser negativo."),
  database: z.coerce.number().min(0, "Custo não pode ser negativo."),
  storage: z.coerce.number().min(0, "Custo não pode ser negativo."),
  serverless: z.coerce.number().min(0, "Custo não pode ser negativo."),
  others: z.coerce.number().min(0, "Custo não pode ser negativo."),
});

type CloudCostFormData = z.infer<typeof cloudCostSchema>;

export default function CloudCostCalculatorPage() {
  const [totalMonthlyCost, setTotalMonthlyCost] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [currency, setCurrency] = useState('BRL');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CloudCostFormData>({
    resolver: zodResolver(cloudCostSchema),
  });

  useEffect(() => {
    document.title = `Calculadora de Custos Cloud - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<CloudCostFormData> = (data) => {
    try {
      const total = data.vps + data.database + data.storage + data.serverless + data.others;
      setTotalMonthlyCost(total);
      toast({ title: "Cálculo Realizado", description: "O custo mensal da nuvem foi estimado." });
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular o custo.", variant: "destructive" });
      setTotalMonthlyCost(null);
    }
  };
  
  const handleReset = () => {
    reset();
    setTotalMonthlyCost(null);
  };

  return (
     <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
    <div>
      <PageHeader
        title="Calculadora de Custos Cloud"
        description="Simule o custo mensal de manter uma aplicação na nuvem."
        icon={<Cloud className="h-6 w-6 text-primary" />}
        actions={<Button asChild variant="outline"><Link href="/dev/systems"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle className="font-headline">Custos Mensais por Serviço</CardTitle>
                <DialogTrigger asChild><Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5 text-muted-foreground"/></Button></DialogTrigger>
            </div>
            <CardDescription>Insira os valores mensais estimados para cada serviço da sua infraestrutura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CurrencySelector value={currency} onChange={setCurrency} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vps">Servidores/VPS ({currency})</Label>
                <Input id="vps" type="number" step="0.01" placeholder="Ex: 50" {...register("vps")} />
                {errors.vps && <p className="text-sm text-destructive mt-1">{errors.vps.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="database">Banco de Dados ({currency})</Label>
                <Input id="database" type="number" step="0.01" placeholder="Ex: 25" {...register("database")} />
                {errors.database && <p className="text-sm text-destructive mt-1">{errors.database.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Armazenamento/Storage ({currency})</Label>
                <Input id="storage" type="number" step="0.01" placeholder="Ex: 10" {...register("storage")} />
                {errors.storage && <p className="text-sm text-destructive mt-1">{errors.storage.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverless">Funções Serverless ({currency})</Label>
                <Input id="serverless" type="number" step="0.01" placeholder="Ex: 15" {...register("serverless")} />
                {errors.serverless && <p className="text-sm text-destructive mt-1">{errors.serverless.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="others">Outros (APIs, etc.) ({currency})</Label>
                <Input id="others" type="number" step="0.01" placeholder="Ex: 30" {...register("others")} />
                {errors.others && <p className="text-sm text-destructive mt-1">{errors.others.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button type="submit">Calcular Custo Total</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {totalMonthlyCost !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Custo Mensal Total Estimado:</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-primary">
                        {totalMonthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: currency })} / mês
                    </p>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && totalMonthlyCost === null && (
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
          <DialogTitle className="font-headline">Dicas para Estimar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
                <li>**Comece pelos Tiers Gratuitos:** A maioria dos provedores (Vercel, AWS, Google Cloud) oferece generosos tiers gratuitos para começar.</li>
                <li>**Use as Calculadoras Oficiais:** Para estimativas precisas, utilize as calculadoras de preço dos próprios provedores. Esta ferramenta serve para uma simulação rápida.</li>
                <li>**Considere o Tráfego:** Os custos podem variar muito com o tráfego de usuários. Estime o uso de banda, requisições e execuções de funções.</li>
                <li>**Não esqueça os custos ocultos:** Inclua custos de domínios, certificados SSL (se não gratuitos), e serviços de email transacional.</li>
            </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Entendi</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
