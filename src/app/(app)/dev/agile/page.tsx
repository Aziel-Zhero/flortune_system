
// src/app/(app)/dev/agile/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IterationCw, KanbanSquare, ListChecks, CalendarDays, MessageSquareText, FileText, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import anime from 'animejs';
import { cn } from "@/lib/utils";

interface AgileFeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status?: "Em breve" | "Planejado";
}

const AgileFeatureCard: React.FC<AgileFeatureCardProps> = ({ title, description, icon: Icon, status = "Em breve" }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 600,
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeOutExpo'
      });
    }
  }, []);

  return (
    <Card ref={cardRef} className="shadow-lg hover:shadow-primary/20 transition-shadow opacity-0">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className="p-2 bg-primary/10 rounded-md">
           <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-headline text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        {status && <p className="text-xs text-primary/70 mt-2 font-medium">{status}</p>}
      </CardContent>
    </Card>
  );
};

export default function DevAgilePage() {
  const pageTitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Metodologias Ágeis (DEV) - ${APP_NAME}`;
    if (pageTitleRef.current) {
      anime({
        targets: pageTitleRef.current.children,
        opacity: [0, 1],
        translateY: [-20, 0],
        scale: [0.98, 1],
        delay: anime.stagger(100),
        easing: 'easeOutExpo',
        duration: 700
      });
    }
  }, []);

  const agileFeatures: AgileFeatureCardProps[] = [
    { title: "Quadro Kanban", description: "Visualize tarefas em colunas: Backlog, A Fazer, Em Andamento, Revisão, Concluído. Arraste e solte cards.", icon: KanbanSquare, status: "Planejado" },
    { title: "Scrum Planner", description: "Gerencie sprints, atribua tarefas, use story points e acompanhe com burndown charts.", icon: ListChecks, status: "Planejado" },
    { title: "Calendário Ágil", description: "Visualize tarefas, reuniões e marcos em um calendário mensal ou semanal. Integração futura com outras partes do sistema.", icon: CalendarDays, status: "Em breve" },
    { title: "Retrospectivas e Check-ins", description: "Espaço dedicado para registrar aprendizados, melhorias e ações para as próximas sprints.", icon: MessageSquareText, status: "Em breve" },
    { title: "Wiki do Projeto / Documentação", description: "Crie documentação ágil para seus projetos usando Markdown ou texto livre.", icon: FileText, status: "Em breve" },
  ];

  return (
    <div>
      <div ref={pageTitleRef}>
        <PageHeader
          title="Metodologias Ágeis (DEV)"
          description="Ferramentas para organizar, planejar e visualizar projetos com produtividade e transparência."
          icon={<IterationCw className="h-6 w-6 text-primary" />}
        />
      </div>
      
      <Card className="mb-8 shadow-md bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center"><Construction className="mr-2"/>Área em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">
            Esta seção está sendo construída para trazer as melhores ferramentas ágeis para o Flortune. 
            Algumas funcionalidades abaixo estão planejadas e outras virão em breve. Animações com Anime.js serão incorporadas gradualmente para uma experiência mais fluida!
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agileFeatures.map(feature => (
          <AgileFeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
