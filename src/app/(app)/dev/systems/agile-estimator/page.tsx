// src/app/(app)/dev/systems/agile-estimator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GanttChartSquare, AlertCircle, BarChartHorizontalBig, HelpCircle, ArrowLeft } from "lucide-react";
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

const agileEstimatorSchema = z.object({
  totalStoryPoints: z.coerce.number().positive("Os story points devem ser positivos."),
  teamVelocity: z.coerce.number().positive("A velocidade deve ser positiva."),
  sprintDurationWeeks: z.coerce.number().positive("A duração deve ser positiva."),
  costPerSprint: z.coerce.number().min(0, "O custo não pode ser negativo."),
});

type AgileEstimatorFormData = z.infer<typeof agileEstimatorSchema>;

export default function AgileEstimatorPage() {
  const [estimatedSprints, setEstimatedSprints] = useState<number | null>(null);
  const [estimatedMonths, setEstimatedMonths] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [currency, setCurrency] = useState('BRL');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AgileEstimatorFormData>({
    resolver: zodResolver(agileEstimatorSchema),
  });

  useEffect(() => {
    document.title = `Estimador Ágil - ${APP_NAME}`;
  }, []);

  const onSubmit: SubmitHandler<AgileEstimatorFormData> = (data) => {
    try {
      const sprints = Math.ceil(data.totalStoryPoints / data.teamVelocity);
      const totalWeeks = sprints * data.sprintDurationWeeks;
      const months = totalWeeks / 4.345; // Média de semanas em um mês
      const cost = sprints * data.costPerSprint;

      setEstimatedSprints(sprints);
      setEstimatedMonths(months);
      setTotalCost(cost);

      toast({ title: "Cálculo Realizado", description: "A estimativa do projeto ágil foi calculada." });
    } catch (error) {
      toast({ title: "Erro no Cálculo", description: "Não foi possível calcular a estimativa.", variant: "destructive" });
      setEstimatedSprints(null);
      setEstimatedMonths(null);
      setTotalCost(null);
    }
  };

  const handleReset = () => {
    reset();
    setEstimatedSprints(null);
    setEstimatedMonths(null);
    setTotalCost(null);
  };

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
    <div>
      <PageHeader
        title="Estimador Ágil (Sprint Estimator)"
        description="Estime o esforço de um projeto ágil baseado em story points e velocidade da equipe."
        icon={<GanttChartSquare className="h-6 w-6 text-primary" />}
        actions={<Button asChild variant="outline"><Link href="/dev/systems"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline">Parâmetros da Estimativa</CardTitle>
              <DialogTrigger asChild><Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5 text-muted-foreground"/></Button></DialogTrigger>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <CurrencySelector value={currency} onChange={setCurrency} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalStoryPoints">Total de Story Points do Projeto</Label>
                <Input id="totalStoryPoints" type="number" placeholder="Ex: 150" {...register("totalStoryPoints")} />
                {errors.totalStoryPoints && <p className="text-sm text-destructive mt-1">{errors.totalStoryPoints.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamVelocity">Velocidade do Time (pontos/sprint)</Label>
                <Input id="teamVelocity" type="number" placeholder="Ex: 25" {...register("teamVelocity")} />
                {errors.teamVelocity && <p className="text-sm text-destructive mt-1">{errors.teamVelocity.message}</p>}
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprintDurationWeeks">Duração da Sprint (semanas)</Label>
                <Input id="sprintDurationWeeks" type="number" placeholder="Ex: 2" {...register("sprintDurationWeeks")} />
                {errors.sprintDurationWeeks && <p className="text-sm text-destructive mt-1">{errors.sprintDurationWeeks.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerSprint">Custo por Sprint ({currency})</Label>
                <Input id="costPerSprint" type="number" step="0.01" placeholder="Ex: 15000" {...register("costPerSprint")} />
                {errors.costPerSprint && <p className="text-sm text-destructive mt-1">{errors.costPerSprint.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="flex gap-2">
                <Button type="submit">Calcular Estimativa</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            
            {estimatedSprints !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Resultados Estimados:</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nº de Sprints:</p>
                    <p className="text-xl font-bold text-primary">{estimatedSprints}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tempo Estimado:</p>
                    <p className="text-xl font-bold text-primary">{estimatedMonths?.toFixed(1)} meses</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custo Total Estimado:</p>
                    <p className="text-xl font-bold text-primary">
                        {totalCost?.toLocaleString('pt-BR', { style: 'currency', currency: currency })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
             {Object.keys(errors).length > 0 && estimatedSprints === null && (
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
            Como as estimativas de projetos ágeis são calculadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p>Esta calculadora fornece uma estimativa de alto nível baseada em duas métricas chave do Scrum/Agile: Story Points e Velocidade.</p>
          <div className="p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto">
            <p className="font-bold">Nº de Sprints =</p>
            <p className="ml-2">Total de Story Points / Velocidade do Time</p>
            <p className="text-muted-foreground ml-2">(Arredondado para cima)</p>
            <br />
            <p className="font-bold">Tempo Total (meses) =</p>
            <p className="ml-2">(Nº de Sprints × Duração da Sprint) / 4.345</p>
            <br />
            <p className="font-bold">Custo Total =</p>
            <p className="ml-2">Nº de Sprints × Custo por Sprint</p>
          </div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>**Story Points** é uma medida abstrata do esforço necessário para implementar uma funcionalidade.</li>
            <li>**Velocidade** é a média de Story Points que uma equipe consegue concluir em uma sprint.</li>
            <li>O **Custo por Sprint** é o custo total da equipe (salários, etc.) durante uma sprint.</li>
          </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Entendi</Button></DialogClose>
        </DialogFooter>
    </DialogContent>
    </Dialog>
  );
}
