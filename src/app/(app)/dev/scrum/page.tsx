// src/app/(app)/dev/scrum/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, GanttChartSquare, BarChart, History, Users, PlusCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import anime from 'animejs';

interface ScrumFeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

const ScrumFeatureCard: React.FC<ScrumFeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <Card className="scrum-card opacity-0 shadow-lg hover:shadow-primary/20 transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="p-3 bg-primary/10 rounded-full">
           <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-headline text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
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
        targets: '.scrum-card, .sprint-card',
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 800,
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeOutExpo'
      });
    }
  }, []);

  const scrumFeatures: ScrumFeatureCardProps[] = [
    { title: "Gerenciar Sprints", description: "Crie, planeje e execute sprints com seu time.", icon: GanttChartSquare },
    { title: "Burndown Chart", description: "Visualize o progresso da sprint em tempo real com gráficos.", icon: BarChart },
    { title: "Gestão de Backlog", description: "Priorize e gerencie as histórias de usuário e tarefas.", icon: ListChecks },
    { title: "Histórico e Retrospectivas", description: "Acesse sprints passadas e registre aprendizados.", icon: History },
  ];

  return (
    <div ref={pageContainerRef}>
      <PageHeader
        title="Scrum Planner (DEV)"
        description="Ferramentas para planejar e executar projetos usando a metodologia Scrum."
        icon={<ListChecks className="h-6 w-6 text-primary" />}
        actions={<Button><PlusCircle className="mr-2"/>Nova Sprint</Button>}
      />
      
       <Card className="mb-8 shadow-md sprint-card opacity-0">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Sprint Atual: "Lançamento V1"</CardTitle>
          <CardDescription>2 de Julho, 2024 - 16 de Julho, 2024 (10 dias restantes)</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-medium text-muted-foreground">Progresso da Sprint (Story Points)</span>
                    <span className="font-semibold">65%</span>
                </div>
                <Progress value={65} className="h-3" />
            </div>
            <div className="mt-4 flex justify-between items-center">
                 <div className="flex -space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-card"><AvatarImage src="https://placehold.co/40x40.png?text=A" data-ai-hint="user avatar" /><AvatarFallback>A</AvatarFallback></Avatar>
                    <Avatar className="h-8 w-8 border-2 border-card"><AvatarImage src="https://placehold.co/40x40.png?text=B" data-ai-hint="user avatar" /><AvatarFallback>B</AvatarFallback></Avatar>
                    <Avatar className="h-8 w-8 border-2 border-card"><AvatarImage src="https://placehold.co/40x40.png?text=C" data-ai-hint="user avatar" /><AvatarFallback>C</AvatarFallback></Avatar>
                </div>
                <div>
                  <span className="text-sm"><strong>8</strong> Tarefas Concluídas</span>
                  <span className="text-sm text-muted-foreground"> / 12</span>
                </div>
            </div>
        </CardContent>
       </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {scrumFeatures.map(feature => (
          <ScrumFeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
