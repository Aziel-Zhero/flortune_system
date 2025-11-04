// src/app/(app)/dev/systems/complexity-estimator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sigma, AlertCircle, BarChartHorizontalBig, HelpCircle, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const factors = [
  { id: 'features', label: 'Nº de Funcionalidades', weight: 0.25, description: 'Quantas features distintas o sistema terá?' },
  { id: 'integrations', label: 'Integrações Externas', weight: 0.20, description: 'Precisa se conectar com quantas APIs ou sistemas de terceiros?' },
  { id: 'uiComplexity', label: 'Complexidade da UI', weight: 0.15, description: 'A interface possui animações, gráficos ou interações complexas?' },
  { id: 'dataModel', label: 'Complexidade do Modelo de Dados', weight: 0.20, description: 'A estrutura do banco de dados é simples ou possui muitas relações?' },
  { id: 'security', label: 'Requisitos de Segurança', weight: 0.10, description: 'Exige múltiplos níveis de acesso, criptografia ou conformidade com normas?' },
  { id: 'scalability', label: 'Necessidade de Escalabilidade', weight: 0.10, description: 'O sistema precisa suportar um grande volume de usuários/dados?' },
];

type FactorId = typeof factors[number]['id'];

export default function ComplexityEstimatorPage() {
  const [scores, setScores] = useState<Record<FactorId, number>>({
    features: 5, integrations: 5, uiComplexity: 5, dataModel: 5, security: 5, scalability: 5
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    document.title = `Estimador de Complexidade - ${APP_NAME}`;
  }, []);

  const totalScore = useMemo(() => {
    return factors.reduce((acc, factor) => {
      return acc + (scores[factor.id as FactorId] * factor.weight);
    }, 0);
  }, [scores]);

  const complexityLevel = useMemo(() => {
    if (totalScore < 4) return { text: "Baixa", color: "bg-green-500" };
    if (totalScore < 7) return { text: "Média", color: "bg-yellow-500" };
    return { text: "Alta", color: "bg-red-500" };
  }, [totalScore]);

  const handleSliderChange = (id: FactorId, value: number[]) => {
    setScores(prev => ({ ...prev, [id]: value[0] }));
  };

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
    <div>
      <PageHeader
        title="Estimador de Complexidade Técnica"
        description="Avalie a complexidade de um sistema para orçar ou planejar sprints."
        icon={<Sigma className="h-6 w-6 text-primary" />}
        actions={<Button asChild variant="outline"><Link href="/dev/systems"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>}
      />
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="font-headline">Fatores de Complexidade</CardTitle>
                <DialogTrigger asChild><Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5 text-muted-foreground"/></Button></DialogTrigger>
            </div>
            <CardDescription>Deslize para avaliar cada fator de 1 (muito simples) a 10 (muito complexo).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            {factors.map(factor => (
                <div key={factor.id} className="space-y-2">
                    <Label htmlFor={factor.id} className="flex justify-between">
                        <span>{factor.label} <span className="text-muted-foreground text-xs">(Peso: {factor.weight * 100}%)</span></span>
                        <Badge variant="outline">{scores[factor.id as FactorId]}</Badge>
                    </Label>
                    <Slider id={factor.id} defaultValue={[5]} min={1} max={10} step={1} onValueChange={(val) => handleSliderChange(factor.id as FactorId, val)} />
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
            ))}
          </CardContent>
          <CardFooter>
            <Card className="w-full bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Resultado da Análise:</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Pontuação Final de Complexidade:</p>
                        <p className="text-2xl font-bold text-primary">{totalScore.toFixed(2)} / 10</p>
                    </div>
                    <div>
                         <p className="text-sm font-medium text-muted-foreground text-right">Nível Estimado:</p>
                         <Badge className={`text-lg text-white ${complexityLevel.color}`}>{complexityLevel.text}</Badge>
                    </div>
                </CardContent>
            </Card>
          </CardFooter>
        </Card>
    </div>
    <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Como Usar o Estimador</DialogTitle>
          <DialogDescription>
            Use esta pontuação para tomar decisões mais informadas sobre seus projetos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm text-muted-foreground">
           <ul className="list-disc list-inside space-y-2">
                <li>**Orçamentos:** Um projeto de complexidade 'Alta' deve ter um preço maior. Use a pontuação como um multiplicador ou para justificar um valor/hora mais elevado na calculadora de esforço.</li>
                <li>**Planejamento de Sprints:** Se a pontuação for alta, considere quebrar o projeto em entregas menores (MVPs) ou alocar mais tempo para pesquisa e arquitetura.</li>
                <li>**Gerenciamento de Riscos:** Uma pontuação alta indica mais riscos. Planeje mais tempo para testes, revisões de código e possíveis refatorações.</li>
           </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Entendi</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
