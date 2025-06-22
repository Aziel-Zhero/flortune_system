// src/app/(app)/dev/scrum/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, GanttChartSquare, BarChart, History, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import anime from 'animejs';

interface ScrumFeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: "Planejado" | "Em Breve";
}

const ScrumFeatureCard: React.FC<ScrumFeatureCardProps> = ({ title, description, icon: Icon, status }) => {
  return (
    <Card className="scrum-card opacity-0 shadow-lg hover:shadow-primary/20 transition-shadow">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className="p-2 bg-primary/10 rounded-md">
           <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-headline text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-primary/80 mt-2 font-medium">{status}</p>
      </CardContent>
    </Card>
  );
};

export default function DevScrumPage() {
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Scrum Planner (DEV) - ${APP_NAME}`;
    if (pageContainerRef.current) {
      anime({
        targets: '.scrum-card',
        translateY: [30, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 800,
        delay: anime.stagger(150, { start: 300 }),
        easing: 'easeOutExpo'
      });
    }
  }, []);

  const scrumFeatures: ScrumFeatureCardProps[] = [
    { title: "Gerenciador de Sprints", description: "Crie e gerencie sprints, atribua tarefas, defina story points e acompanhe o progresso.", icon: GanttChartSquare, status: "Planejado" },
    { title: "Burndown Chart", description: "Visualize o progresso da sprint em tempo real com um gráfico de burndown automático.", icon: BarChart, status: "Planejado" },
    { title: "Histórico de Sprints", description: "Acesse e revise sprints finalizadas para análise e planejamento futuro.", icon: History, status: "Em Breve" },
    { title: "Retrospectivas", description: "Um espaço dedicado para registrar aprendizados, melhorias e ações para as próximas sprints.", icon: ListChecks, status: "Em Breve" },
  ];

  return (
    <div ref={pageContainerRef}>
      <PageHeader
        title="Scrum Planner (DEV)"
        description="Ferramentas para planejar e executar projetos usando a metodologia Scrum."
        icon={<ListChecks className="h-6 w-6 text-primary" />}
      />
      
      <Card className="mb-8 shadow-md bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center"><Construction className="mr-2"/>Área em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">
            Esta seção está sendo construída para trazer as melhores ferramentas para gestão de projetos Scrum. 
            As funcionalidades abaixo estão planejadas para desenvolvimento futuro. Animações com Anime.js foram adicionadas para uma experiência de entrada mais fluida!
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scrumFeatures.map(feature => (
          <ScrumFeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
