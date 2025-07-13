// src/app/(app)/dev/systems/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, Calculator, Coins, ClockIcon, Repeat, ServerCog, Briefcase, PercentSquare, GanttChartSquare, Cloud, Sigma } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status?: "Pronto" | "Em Breve";
}

const tools: ToolCardProps[] = [
  {
    title: "Orçamento de Projeto Tech",
    description: "Calcule o custo estimado de um software baseado em escopo, tempo e complexidade.",
    icon: Calculator,
    href: "/dev/systems/project-pricing",
    status: "Em Breve",
  },
  {
    title: "Precificação de Automação (ROI)",
    description: "Justifique valor com base no ganho anual estimado para o cliente. Use o exemplo fornecido.",
    icon: Briefcase,
    href: "/dev/systems/automation-pricing",
    status: "Pronto",
  },
  {
    title: "Estimador Ágil (Sprint Estimator)",
    description: "Estime o esforço de um projeto ágil baseado em story points e velocidade da equipe.",
    icon: GanttChartSquare,
    href: "/dev/systems/agile-estimator",
    status: "Em Breve",
  },
  {
    title: "Calculadora de Custos Cloud",
    description: "Simule o custo mensal de manter uma aplicação na nuvem (AWS, Vercel, etc.).",
    icon: Cloud,
    href: "/dev/systems/cloud-cost-calculator",
    status: "Em Breve",
  },
   {
    title: "Calculadora de Faturamento Freelancer",
    description: "Planeje seu faturamento com base em carga horária, folgas e valor hora.",
    icon: DollarSign,
    href: "/dev/systems/freelancer-billing",
    status: "Em Breve",
  },
  {
    title: "Estimador de Complexidade Técnica",
    description: "Avalie a complexidade de um sistema para orçar ou planejar sprints com mais precisão.",
    icon: Sigma,
    href: "/dev/systems/complexity-estimator",
    status: "Em Breve",
  },
];

export default function DevSystemsPage() {
  useEffect(() => {
    document.title = `Sistemas e Ferramentas (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Sistemas e Ferramentas (DEV)"
        description="Calculadoras e utilitários para desenvolvedores, freelancers e gestão de projetos."
        icon={<HardDrive className="h-6 w-6 text-primary" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.href} className={cn("shadow-lg hover:shadow-primary/20 transition-shadow flex flex-col", tool.status === "Em Breve" && "opacity-70 hover:opacity-100")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", tool.status === "Pronto" ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-headline text-lg">{tool.title}</CardTitle>
              </div>
              <CardDescription className="text-sm min-h-[60px]">{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className={cn("text-xs font-medium", tool.status === "Pronto" ? "text-emerald-600" : "text-amber-600")}>
                Status: {tool.status}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant={tool.status === "Pronto" ? "default" : "outline"}
                className="w-full"
                disabled={tool.status !== "Pronto"}
              >
                <Link href={tool.status === "Pronto" ? tool.href : "#"}>
                  Abrir Ferramenta
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
