
// src/app/(app)/dev/kanban/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanSquare, CheckSquare, Clock, XSquare, Construction, PlusCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import anime from 'animejs';

interface KanbanColumnProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  taskCount: number;
}

const KanbanColumnCard: React.FC<KanbanColumnProps> = ({ title, icon: Icon, iconColor, taskCount }) => {
  return (
    <Card className="kanban-card opacity-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{taskCount}</div>
        <p className="text-xs text-muted-foreground">tarefas nesta coluna</p>
      </CardContent>
    </Card>
  );
};

export default function DevKanbanPage() {
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Quadro Kanban (DEV) - ${APP_NAME}`;
    if (pageContainerRef.current) {
      anime({
        targets: '.kanban-card',
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 700,
        delay: anime.stagger(120, { start: 300 }),
        easing: 'easeOutExpo'
      });
    }
  }, []);

  const kanbanColumns: KanbanColumnProps[] = [
    { title: "Backlog", icon: PlusCircle, iconColor: "text-muted-foreground", taskCount: 8 },
    { title: "A Fazer", icon: Clock, iconColor: "text-blue-500", taskCount: 4 },
    { title: "Em Andamento", icon: KanbanSquare, iconColor: "text-yellow-500", taskCount: 2 },
    { title: "Concluído", icon: CheckSquare, iconColor: "text-green-500", taskCount: 15 },
    { title: "Arquivado", icon: XSquare, iconColor: "text-red-500", taskCount: 3 },
  ];

  return (
    <div ref={pageContainerRef}>
      <PageHeader
        title="Quadro Kanban (DEV)"
        description="Visualize e gerencie o fluxo de trabalho de seus projetos de forma ágil e transparente."
        icon={<KanbanSquare className="h-6 w-6 text-primary" />}
      />
      
      <Card className="mb-8 shadow-md bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center"><Construction className="mr-2"/>Em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">
            Esta é uma representação visual do futuro Quadro Kanban. Funcionalidades como arrastar e soltar (drag-and-drop), 
            criação de tarefas e personalização de colunas serão implementadas em breve.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kanbanColumns.map(column => (
          <KanbanColumnCard key={column.title} {...column} />
        ))}
      </div>
    </div>
  );
}
