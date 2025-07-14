// src/app/(app)/dev/systems/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, Calculator, Coins, ClockIcon, Repeat, ServerCog, Briefcase, PercentSquare } from "lucide-react";
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
    title: "Precificação de Projetos Freelancer",
    description: "Calcule o preço de projetos com base em valor/hora, complexidade e margem.",
    icon: Calculator,
    href: "/dev/systems/project-pricing",
    status: "Pronto",
  },
  {
    title: "Precificação de Automação (ROI)",
    description: "Justifique valor com base no ganho anual estimado para o cliente.",
    icon: Briefcase,
    href: "/dev/systems/automation-pricing",
    status: "Pronto",
  },
  {
    title: "Precificação de Pacotes/Assinaturas",
    description: "Estruture preços para serviços recorrentes e pacotes escaláveis.",
    icon: PercentSquare,
    href: "/dev/systems/package-pricing",
    status: "Pronto",
  },
  {
    title: "Conversor de Moeda",
    description: "Converta valores entre diferentes moedas usando uma API externa.",
    icon: Coins,
    href: "/dev/systems/currency-converter",
    status: "Pronto",
  },
  {
    title: "Conversor de Tempo",
    description: "Converta unidades de tempo (minutos, horas, dias).",
    icon: ClockIcon,
    href: "/dev/systems/time-converter",
    status: "Pronto",
  },
  {
    title: "Juros Compostos / Simples",
    description: "Simule o crescimento de capital com diferentes taxas e períodos.",
    icon: Repeat,
    href: "/dev/systems/interest-calculator",
    status: "Pronto",
  },
  {
    title: "Calculadora de Uptime (SLA)",
    description: "Entenda o tempo de inatividade para um SLA específico.",
    icon: ServerCog,
    href: "/dev/systems/uptime-calculator",
    status: "Pronto",
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
