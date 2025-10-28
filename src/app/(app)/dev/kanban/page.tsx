
// src/app/(app)/dev/kanban/page.tsx
"use client";

import React, { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, type DragStartEvent, type DragOverEvent, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  columnId: string;
  points?: number;
  assignedTo?: Assignee;
  dueDate?: string;
  tag?: { name: string; color: string; };
}

interface Column {
  id: string;
  name: string;
}

const taskSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  points: z.coerce.number().optional(),
  assignedTo: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskSchema>;

// --- Initial Data ---
const initialColumns: Column[] = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'doing', name: 'Em Andamento' },
  { id: 'done', name: 'Concluído' },
];

const initialTasks: Task[] = [
    { id: '1', columnId: 'backlog', title: 'Configurar autenticação OAuth com Google', points: 3, dueDate: '2025-07-25', assignedTo: { name: 'João Silva' }, tag: { name: 'Backend', color: 'bg-blue-200 text-blue-800 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700' } },
    { id: '2', columnId: 'backlog', title: 'Desenvolver componente de calendário financeiro', points: 5, dueDate: '2025-07-28', assignedTo: { name: 'Maria Pereira' }, tag: { name: 'Frontend', color: 'bg-green-200 text-green-800 border border-green-400 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' } },
    { id: '3', columnId: 'doing', title: 'Criar página de dashboard com gráficos', points: 8, dueDate: '2025-08-02', assignedTo: { name: 'Lucas Costa' }, tag: { name: 'Frontend', color: 'bg-green-200 text-green-800 border border-green-400 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' } },
    { id: '4', columnId: 'done', title: 'Estruturar projeto Next.js com ShadCN', points: 2, dueDate: '2025-07-20', assignedTo: { name: 'Ana Souza' }, tag: { name: 'Infra', color: 'bg-purple-200 text-purple-800 border border-purple-400 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700' } },
];


// --- Sub-components ---
const KanbanCard: React.FC<{ task: Task }> = ({ task }) => {
  const { title, points, assignedTo, dueDate, tag } = task;
  return (
    <div className="bg-card rounded-md shadow-sm border p-3 mb-2 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
      <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {assignedTo && (
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
          )}
          {points !== undefined && (
            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">{points} pts</span>
          )}
        </div>
        <div className="text-right flex items-center gap-2">
          {dueDate && (<div className="text-xs text-muted-foreground/80 flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{format(new Date(dueDate + 'T00:00:00'), 'dd/MM')}</span></div>)}
          {tag && (<span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tag.color)}>{tag.name}</span>)}
        </div>
      </div>
    </div>
  );
};

const SortableKanbanCard: React.FC<{ task: Task }> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task }});
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-50")}>
            <KanbanCard task={task} />
        </div>
    );
}

const KanbanColumn: React.FC<{ column: Column; tasks: Task[] }> = ({ column, tasks }) => {
    const { setNodeRef, isOver } = useSortable({ id: column.id, data: { type: 'Column', column } });
    return (
      <div ref={setNodeRef} className="w-80 bg-muted/50 rounded-lg p-3 flex flex-col flex-shrink-0 max-h-[calc(100vh-16rem)]">
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-lg font-bold font-headline text-foreground">{column.name}</h2>
          <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded-md">{tasks.length} / {tasks.reduce((sum, task) => sum + (task.points || 0), 0)} pts</span>
        </div>
        <div className={cn("flex-1 space-y-2 transition-colors duration-200 p-1 rounded-md overflow-y-auto", isOver && "bg-primary/10")}>
            <SortableContext items={tasks.map(t => t.id)}>
                {tasks.map(task => <SortableKanbanCard key={task.id} task={task} />)}
            </SortableContext>
        </div>
      </div>
    );
}

// --- Main Page Component ---
export default function DevKanbanPage() {
  const [columns] = useState<Column[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({ resolver: zodResolver(taskSchema), });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
        setActiveTask(event.active.data.current.task);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    
    if (isActiveTask && isOverTask) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === active.id);
            const overIndex = currentTasks.findIndex(t => t.id === over.id);
            if (currentTasks[activeIndex].columnId !== currentTasks[overIndex].columnId) {
                currentTasks[activeIndex].columnId = currentTasks[overIndex].columnId;
                return arrayMove(currentTasks, activeIndex, overIndex -1);
            }
            return arrayMove(currentTasks, activeIndex, overIndex);
        });
    }

    const isOverColumn = over.data.current?.type === 'Column';
    if(isActiveTask && isOverColumn) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === active.id);
            currentTasks[activeIndex].columnId = over.id as string;
            return arrayMove(currentTasks, activeIndex, activeIndex);
        })
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
  }

  const handleAddTask: SubmitHandler<TaskFormData> = (data) => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      columnId: 'backlog',
      title: data.title,
      points: data.points,
      assignedTo: data.assignedTo ? { name: data.assignedTo } : undefined,
    };
    setTasks(current => [newTask, ...current]);
    toast({ title: "Tarefa Adicionada!", description: `"${data.title}" foi adicionada ao Backlog.`});
    reset({ title: "", points: undefined, assignedTo: "" });
    setIsTaskModalOpen(false);
  };
  
  return (
    <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
      <div className="flex flex-col h-full">
        <PageHeader title="Quadro Kanban (DEV)" description="Visualize e gerencie o fluxo de trabalho. Arraste e solte as tarefas." icon={<KanbanSquare />} />
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetection={closestCorners}>
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
              <SortableContext items={columns.map(c => c.id)}>
                {columns.map(col => (
                  <KanbanColumn key={col.id} column={col} tasks={tasks.filter(t => t.columnId === col.id)} />
                ))}
              </SortableContext>
            <div className="w-72 flex-shrink-0">
               <DialogTrigger asChild><Button variant="outline" className="w-full h-12"><PlusCircle className="h-5 w-5 mr-2"/>Adicionar Tarefa</Button></DialogTrigger>
            </div>
          </div>
          <DragOverlay>{activeTask ? <KanbanCard task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </div>
       <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle><DialogDescription>Adicione uma nova tarefa ao backlog do projeto.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(handleAddTask)} className="space-y-4">
              <div><Label htmlFor="title">Título da Tarefa</Label><Input id="title" {...register("title")} />{errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="points">Story Points</Label><Input id="points" type="number" {...register("points")} /></div>
                  <div><Label htmlFor="assignedTo">Atribuído a</Label><Input id="assignedTo" {...register("assignedTo")} placeholder="Nome do membro" /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Adicionar ao Backlog</Button></DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
