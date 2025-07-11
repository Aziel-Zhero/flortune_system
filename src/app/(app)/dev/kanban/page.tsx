
// src/app/(app)/dev/kanban/page.tsx
"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { PageHeader } from "@/components/shared/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KanbanSquare, PlusCircle, Calendar } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

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

const taskSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  points: z.coerce.number().optional(),
  assignedTo: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// --- Initial Data ---
const initialColumns: ColumnsState = {
  backlog: {
    name: 'Backlog',
    tasks: [
      { id: '1', title: 'Configurar autenticação OAuth com Google', points: 3, dueDate: '2025-07-25', assignedTo: { name: 'João Silva' }, tag: { name: 'Backend', color: 'bg-blue-200 text-blue-800 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700' } },
      { id: '2', title: 'Desenvolver componente de calendário financeiro', points: 5, dueDate: '2025-07-28', assignedTo: { name: 'Maria Pereira' }, tag: { name: 'Frontend', color: 'bg-green-200 text-green-800 border border-green-400 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' } },
    ],
  },
  doing: {
    name: 'Em Andamento',
    tasks: [
      { id: '3', title: 'Criar página de dashboard com gráficos', points: 8, dueDate: '2025-08-02', assignedTo: { name: 'Lucas Costa' }, tag: { name: 'Frontend', color: 'bg-green-200 text-green-800 border border-green-400 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' } },
    ],
  },
  done: {
    name: 'Concluído',
    tasks: [
      { id: '4', title: 'Estruturar projeto Next.js com ShadCN', points: 2, dueDate: '2025-07-20', assignedTo: { name: 'Ana Souza' }, tag: { name: 'Infra', color: 'bg-purple-200 text-purple-800 border border-purple-400 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700' } },
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
              <Calendar className="h-3 w-3" />
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

// --- Main Page Component ---
export default function DevKanbanPage() {
  const [columns, setColumns] = useState<ColumnsState>(initialColumns);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
        const column = columns[source.droppableId];
        const copiedTasks = [...column.tasks];
        const [removed] = copiedTasks.splice(source.index, 1);
        copiedTasks.splice(destination.index, 0, removed);
        setColumns({ ...columns, [source.droppableId]: { ...column, tasks: copiedTasks } });
    } else {
        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const sourceTasks = [...sourceColumn.tasks];
        const destTasks = [...destColumn.tasks];
        const [removed] = sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, removed);
        setColumns({
            ...columns,
            [source.droppableId]: { ...sourceColumn, tasks: sourceTasks },
            [destination.droppableId]: { ...destColumn, tasks: destTasks }
        });
    }
  };
  
  const handleAddTask: SubmitHandler<TaskFormData> = (data) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: data.title,
      points: data.points,
      assignedTo: data.assignedTo ? { name: data.assignedTo } : undefined,
    };
    
    const updatedBacklog = {
      ...columns.backlog,
      tasks: [newTask, ...columns.backlog.tasks],
    };
    
    setColumns({ ...columns, backlog: updatedBacklog });
    toast({ title: "Tarefa Adicionada!", description: `"${data.title}" foi adicionada ao Backlog.`});
    reset({ title: "", points: undefined, assignedTo: "" });
    setIsTaskModalOpen(false);
  };

  return (
    <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Quadro Kanban (DEV)"
          description="Visualize e gerencie o fluxo de trabalho de forma ágil. Arraste e solte as tarefas entre as colunas."
          icon={<KanbanSquare className="h-6 w-6 text-primary" />}
        />
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {Object.entries(columns).map(([id, col]) => (
              <div key={id} className="w-80 bg-muted/50 rounded-lg p-3 flex flex-col flex-shrink-0 max-h-[calc(100vh-16rem)]">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h2 className="text-lg font-bold font-headline text-foreground">{col.name}</h2>
                  <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded-md">{col.tasks.length} / {col.tasks.reduce((sum, task) => sum + (task.points || 0), 0)} pts</span>
                </div>
                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div
                      className={cn(
                        "flex-1 space-y-2 transition-colors duration-200 p-1 rounded-md overflow-y-auto",
                        snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-transparent'
                      )}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {col.tasks.map((task, index) => (
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
              </div>
            ))}
            <div className="w-72 flex-shrink-0">
              <DialogTrigger asChild>
                  <button className="w-full h-full bg-muted/30 hover:bg-muted/60 transition-colors rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <PlusCircle className="h-5 w-5 mr-2"/>
                      Adicionar Tarefa
                  </button>
              </DialogTrigger>
            </div>
          </div>
        </DragDropContext>
      </div>
       <DialogContent>
          <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
              <DialogDescription>Adicione uma nova tarefa ao backlog do projeto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAddTask)} className="space-y-4">
              <div>
                  <Label htmlFor="title">Título da Tarefa</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="points">Story Points</Label>
                      <Input id="points" type="number" {...register("points")} />
                  </div>
                  <div>
                      <Label htmlFor="assignedTo">Atribuído a</Label>
                      <Input id="assignedTo" {...register("assignedTo")} placeholder="Nome do membro" />
                  </div>
              </div>
              <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Adicionar ao Backlog</Button>
              </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
