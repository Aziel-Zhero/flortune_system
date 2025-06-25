
// src/app/(app)/dev/kanban/page.tsx
"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { PageHeader } from "@/components/shared/page-header";
import { KanbanSquare, PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Types ---
interface Assignee {
  name: string;
  avatarUrl?: string | null;
}

interface Task {
  id: string;
  title: string;
  points?: number;
  assignedTo?: Assignee;
  dueDate?: string;
  tag?: { name: string; color: string; };
}

interface Column {
  name: string;
  tasks: Task[];
}

interface ColumnsState {
  [key: string]: Column;
}

// --- Initial Data ---
const initialColumns: ColumnsState = {
  backlog: {
    name: 'Backlog',
    tasks: [
      { id: '1', title: 'Configurar autenticação OAuth com Google', points: 3, dueDate: '2025-07-25', assignedTo: { name: 'João Silva' }, tag: { name: 'Backend', color: 'bg-blue-100 text-blue-800' } },
      { id: '2', title: 'Desenvolver componente de calendário financeiro', points: 5, dueDate: '2025-07-28', assignedTo: { name: 'Maria Pereira' }, tag: { name: 'Frontend', color: 'bg-green-100 text-green-800' } },
    ],
  },
  doing: {
    name: 'Em Andamento',
    tasks: [
      { id: '3', title: 'Criar página de dashboard com gráficos', points: 8, dueDate: '2025-08-02', assignedTo: { name: 'Lucas Costa' }, tag: { name: 'Frontend', color: 'bg-green-100 text-green-800' } },
    ],
  },
  done: {
    name: 'Concluído',
    tasks: [
      { id: '4', title: 'Estruturar projeto Next.js com ShadCN', points: 2, dueDate: '2025-07-20', assignedTo: { name: 'Ana Souza' }, tag: { name: 'Infra', color: 'bg-purple-100 text-purple-800' } },
    ],
  },
};

// --- Sub-components ---
const KanbanCard: React.FC<{ task: Task }> = ({ task }) => {
  const { title, points, assignedTo, dueDate, tag } = task;

  return (
    <div className="bg-card rounded-md shadow-sm border p-3 mb-2 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignedTo?.avatarUrl || undefined} alt={assignedTo?.name}/>
                  <AvatarFallback className="text-[10px]">{assignedTo?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent><p>{assignedTo?.name || "Não atribuído"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {points !== undefined && (
            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">{points} pts</span>
          )}
        </div>
        <div className="text-right flex items-center gap-2">
          {dueDate && (
            <div className="text-xs text-muted-foreground/80 flex items-center gap-1">
              <span>🗓️</span>
              <span>{format(new Date(dueDate + 'T00:00:00'), 'dd/MM')}</span>
            </div>
          )}
          {tag && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tag.color)}>{tag.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ title: string; tasks: Task[]; droppableId: string }> = ({ title, tasks, droppableId }) => {
  const totalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0);
  
  return (
    <div className="w-80 bg-muted/50 rounded-lg p-3 flex flex-col flex-shrink-0 max-h-[calc(100vh-16rem)]">
       <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-lg font-bold font-headline text-foreground">{title}</h2>
        <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded-md">{tasks.length} / {totalPoints} pts</span>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            className={cn(
              "flex-1 space-y-2 transition-colors duration-200 p-1 rounded-md overflow-y-auto",
              snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-transparent'
            )}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <KanbanCard task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
       <button className="mt-3 text-sm text-muted-foreground hover:text-primary flex items-center justify-center p-2 rounded-md hover:bg-primary/10 transition-colors">
        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Tarefa
      </button>
    </div>
  );
};


// --- Main Page Component ---
export default function DevKanbanPage() {
  const [columns, setColumns] = useState<ColumnsState>(initialColumns);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      // Reordenar na mesma coluna
      const column = columns[source.droppableId];
      const newTasks = Array.from(column.tasks);
      const [reorderedItem] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, reorderedItem);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          tasks: newTasks,
        },
      });
    } else {
      // Mover para uma coluna diferente
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceTasks = Array.from(sourceColumn.tasks);
      const destTasks = Array.from(destColumn.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, movedTask);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: sourceTasks,
        },
        [destination.droppableId]: {
          ...destColumn,
          tasks: destTasks,
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Quadro Kanban (DEV)"
        description="Visualize e gerencie o fluxo de trabalho de forma ágil. Arraste e solte as tarefas entre as colunas."
        icon={<KanbanSquare className="h-6 w-6 text-primary" />}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {Object.entries(columns).map(([id, col]) => (
            <KanbanColumn key={id} title={col.name} tasks={col.tasks} droppableId={id} />
          ))}
           <div className="w-72 flex-shrink-0">
             <button className="w-full h-12 bg-muted/30 hover:bg-muted/60 transition-colors rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">
                <PlusCircle className="h-5 w-5 mr-2"/>
                Adicionar nova coluna
            </button>
           </div>
        </div>
      </DragDropContext>
    </div>
  );
}
