
// src/app/(app)/dev/systems/calculators/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, DraftingCompass, Scale, Landmark, Percent, Clock, Network } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CalculatorTool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  link?: string; // Futuramente para a página da calculadora específica
  devStatus: "planned" | "in-progress" | "completed";
}

const calculatorTools: CalculatorTool[] = [
  {
    id: "price-project",
    title: "Precificação de Projetos (Freelancer)",
    description: "Calcule o preço ideal para seus projetos com base em valor/hora, horas, complexidade e taxas.",
    icon: DraftingCompass,
    devStatus: "planned",
  },
  {
    id: "currency-converter",
    title: "Conversor de Moeda",
    description: "Converta valores entre diferentes moedas com cotações atualizadas (API futura).",
    icon: Scale,
    devStatus: "planned",
  },
  {
    id: "time-converter",
    title: "Conversor de Tempo",
    description: "Converta unidades de tempo (minutos, horas, dias) e formatos (HH:MM).",
    icon: Clock,
    devStatus: "planned",
  },
  {
    id: "compound-interest",
    title: "Juros Compostos / Simples",
    description: "Simule o crescimento do seu capital com diferentes taxas e períodos.",
    icon: Percent,
    devStatus: "planned",
  },
  {
    id: "uptime-calculator",
    title: "Calculadora de Uptime (SLA)",
    description: "Entenda o tempo de inatividade correspondente a uma porcentagem de uptime.",
    icon: Network,
    devStatus: "planned",
  },
];

export default function CalculatorsPage() {
  useEffect(() => {
    document.title = `Calculadoras e Ferramentas - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Calculadoras e Ferramentas"
        description="Ferramentas úteis para auxiliar no seu planejamento financeiro e produtividade."
        icon={<Calculator className="h-6 w-6 text-primary" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculatorTools.map((tool) => (
          <Card key={tool.id} className="shadow-lg hover:shadow-primary/20 transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <tool.icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-headline text-lg">{tool.title}</CardTitle>
              </div>
              <CardDescription className="text-sm min-h-[60px]">{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Conteúdo futuro ou campos básicos desabilitados */}
              <p className="text-xs text-muted-foreground italic">
                Status: {tool.devStatus === 'planned' ? 'Planejada' : tool.devStatus === 'in-progress' ? 'Em desenvolvimento' : 'Concluída'}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                disabled // Desabilitado por enquanto
                onClick={() => tool.link && alert(`Redirecionando para ${tool.link}`)}
              >
                Abrir {tool.icon === Calculator ? "Calculadora" : "Ferramenta"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
