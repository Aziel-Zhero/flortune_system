// src/app/(app)/dev/kanban/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, type DragStartEvent, type DragOverEvent, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { PageHeader } from "@/components/shared/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanSquare, PlusCircle, Calendar, DollarSign, AlertTriangle, Settings, Trash2, Edit } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { PrivateValue } from '@/components/shared/private-value';

// --- Tipos ---
interface Assignee {
  name: string;
  avatarUrl?: string | null;
}

type TagType = 'Frontend' | 'Backend' | 'Infra' | 'Bug' | 'Outro';

interface Task {
  id: string;
  columnId: string;
  title: string;
  points?: number;
  assignedTo?: string;
  dueDate?: string;
  tag?: { name: TagType; color: string; };
  value?: number;
  delayCost?: number;
}

interface Column {
  id: string;
  name: string;
  wipLimit?: number;
}

const taskSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  points: z.coerce.number().optional(),
  assignedTo: z.string().optional(),
  value: z.coerce.number().optional(),
  delayCost: z.coerce.number().optional(),
  tag: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskSchema>;

const columnSchema = z.object({
  name: z.string().min(2, "O nome da coluna é obrigatório."),
  wipLimit: z.coerce.number().min(0, "O limite não pode ser negativo.").optional(),
});
type ColumnFormData = z.infer<typeof columnSchema>;

const tagConfig: Record<TagType, string> = {
    Frontend: 'bg-green-200 text-green-800 border border-green-400 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700',
    Backend: 'bg-blue-200 text-blue-800 border border-blue-400 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700',
    Infra: 'bg-purple-200 text-purple-800 border border-purple-400 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700',
    Bug: 'bg-red-200 text-red-800 border border-red-400 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700',
    Outro: 'bg-gray-200 text-gray-800 border border-gray-400 dark:bg-gray-900/50 dark:text-gray-200 dark:border-gray-700',
};


// --- Initial Data ---
const initialColumns: Column[] = [
  { id: 'backlog', name: 'Backlog de Espera' },
  { id: 'todo', name: 'A Fazer', wipLimit: 5 },
  { id: 'doing', name: 'Em Andamento', wipLimit: 3 },
  { id: 'done', name: 'Concluído' },
];

const initialTasks: Task[] = [
    { id: '1', columnId: 'backlog', title: 'Configurar autenticação OAuth', points: 3, dueDate: '2025-07-25', assignedTo: 'João S.', tag: { name: 'Backend', color: tagConfig.Backend }, value: 1500, delayCost: 100 },
    { id: '2', columnId: 'todo', title: 'Desenvolver componente de calendário', points: 5, dueDate: '2025-07-28', assignedTo: 'Maria P.', tag: { name: 'Frontend', color: tagConfig.Frontend }, value: 2500, delayCost: 150 },
    { id: '3', columnId: 'doing', title: 'Criar página de dashboard com gráficos', points: 8, dueDate: '2025-08-02', assignedTo: 'Lucas C., Ana S.', tag: { name: 'Frontend', color: tagConfig.Frontend }, value: 4000, delayCost: 200 },
    { id: '4', columnId: 'done', title: 'Estruturar projeto Next.js com ShadCN', points: 2, dueDate: '2025-07-20', assignedTo: 'Ana S.', tag: { name: 'Infra', color: tagConfig.Infra }, value: 1000, delayCost: 50 },
];


// --- Sub-components ---
const KanbanCard: React.FC<{ task: Task }> = ({ task }) => {
  const { title, points, assignedTo, dueDate, tag, value, delayCost } = task;

  const assignees = assignedTo?.split(',').map(name => name.trim()).filter(Boolean);

  return (
    <div className="bg-card rounded-md shadow-sm border p-3 mb-2 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
      <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
        {(value !== undefined || delayCost !== undefined) && (
             <div className="flex items-center justify-between">
                {value !== undefined && <div className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-green-500" /><span className='font-medium text-green-600'><PrivateValue value={value.toLocaleString('pt-BR')} /></span></div>}
                {delayCost !== undefined && <div className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-500" /><span className='font-medium text-red-600'><PrivateValue value={delayCost.toLocaleString('pt-BR')} />/sem</span></div>}
            </div>
        )}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            {assignees && assignees.length > 0 && (
                <div className="flex -space-x-2">
                {assignees.map((name, i) => (
                    <TooltipProvider key={i}><Tooltip><TooltipTrigger>
                        <Avatar className="h-6 w-6 border-2 border-background"><AvatarFallback className="text-[10px]">{name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    </TooltipTrigger><TooltipContent><p>{name}</p></TooltipContent></Tooltip></TooltipProvider>
                ))}
                </div>
            )}
            {points !== undefined && (<span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">{points} pts</span>)}
            </div>
            <div className="text-right flex items-center gap-2">
            {dueDate && (<div className="text-xs text-muted-foreground/80 flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{format(new Date(dueDate + 'T00:00:00'), 'dd/MM')}</span></div>)}
            {tag && (<span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tag.color)}>{tag.name}</span>)}
            </div>
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

const KanbanColumn: React.FC<{ column: Column; tasks: Task[]; onEdit: () => void; onDelete: () => void; }> = ({ column, tasks, onEdit, onDelete }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: column.id, data: { type: 'Column', column } });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const tasksCount = tasks.length;
    const isWipExceeded = column.wipLimit !== undefined && tasksCount > column.wipLimit;

    return (
      <div ref={setNodeRef} style={style} {...attributes} className={cn("w-80 bg-muted/50 rounded-lg flex flex-col flex-shrink-0 max-h-[calc(100vh-16rem)]", isDragging && "opacity-30")}>
        <div {...listeners} className={cn("flex justify-between items-center mb-3 px-3 pt-3 pb-1 cursor-grab active:cursor-grabbing", isWipExceeded && "bg-red-500/20 rounded-t-lg")}>
          <h2 className="text-lg font-bold font-headline text-foreground">{column.name}</h2>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded-md", isWipExceeded && "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100 font-bold")}>
              {tasksCount}{column.wipLimit ? ` / ${column.wipLimit}` : ''}
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-4 w-4"/></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} disabled={tasks.length > 0} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Remover</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1 space-y-2 p-3 pt-0 rounded-md overflow-y-auto">
            <SortableContext items={tasks.map(t => t.id)}>
                {tasks.map(task => <SortableKanbanCard key={task.id} task={task} />)}
            </SortableContext>
        </div>
      </div>
    );
}

// --- Main Page Component ---
export default function DevKanbanPage() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  
  const [activeElement, setActiveElement] = useState<Task | Column | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TaskFormData>({ resolver: zodResolver(taskSchema), });

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const { register: columnRegister, handleSubmit: handleColumnSubmit, reset: resetColumnForm, formState: { errors: columnErrors } } = useForm<ColumnFormData>({ resolver: zodResolver(columnSchema) });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') setActiveElement(event.active.data.current.task);
    if (event.active.data.current?.type === 'Column') setActiveElement(event.active.data.current.column);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const isActiveTask = active.data.current?.type === 'Task';
    if (!isActiveTask) return;

    const isOverColumn = over.data.current?.type === 'Column';
    if(isOverColumn) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === active.id);
            if (currentTasks[activeIndex].columnId !== over.id) {
                 currentTasks[activeIndex].columnId = over.id as string;
                 return arrayMove(currentTasks, activeIndex, activeIndex);
            }
            return currentTasks;
        })
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveElement(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (active.data.current?.type === 'Column') {
      setColumns(currentCols => {
        const oldIndex = currentCols.findIndex(c => c.id === active.id);
        const newIndex = currentCols.findIndex(c => c.id === over.id);
        return arrayMove(currentCols, oldIndex, newIndex);
      });
      return;
    }
    
    if (active.data.current?.type === 'Task') {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === active.id);
            const overIndex = currentTasks.findIndex(t => t.id === over.id);
            return arrayMove(currentTasks, activeIndex, overIndex);
        })
    }
  }

  const handleAddTask: SubmitHandler<TaskFormData> = (data) => {
    const newTag = data.tag ? { name: data.tag as TagType, color: tagConfig[data.tag as TagType] } : undefined;
    const newTask: Task = {
      id: `task_${Date.now()}`, columnId: 'backlog', title: data.title, points: data.points,
      assignedTo: data.assignedTo, tag: newTag, value: data.value, delayCost: data.delayCost,
    };
    setTasks(current => [newTask, ...current]);
    toast({ title: "Tarefa Adicionada!", description: `"${data.title}" foi adicionada ao Backlog de Espera.`});
    reset({ title: "", points: undefined, assignedTo: "" });
    setIsTaskModalOpen(false);
  };
  
  const handleOpenColumnModal = (column: Column | null = null) => {
    setEditingColumn(column);
    resetColumnForm(column || { name: "", wipLimit: undefined });
    setIsColumnModalOpen(true);
  }

  const handleColumnAction: SubmitHandler<ColumnFormData> = (data) => {
    if (editingColumn) {
      setColumns(prev => prev.map(c => c.id === editingColumn.id ? { ...c, ...data } : c));
      toast({ title: "Coluna Atualizada!" });
    } else {
      setColumns(prev => [...prev, { id: `col_${Date.now()}`, ...data }]);
      toast({ title: "Coluna Adicionada!" });
    }
    setIsColumnModalOpen(false);
    setEditingColumn(null);
  }
  
  const handleRemoveColumn = (columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId));
    toast({ title: "Coluna Removida", variant: "destructive" });
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Quadro Kanban (DEV)" description="Visualize e gerencie o fluxo de trabalho. Arraste e solte tarefas e colunas." icon={<KanbanSquare />} />
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetection={closestCorners}>
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
              <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                {columns.map(col => (
                  <KanbanColumn key={col.id} column={col} tasks={tasks.filter(t => t.columnId === col.id)} onEdit={() => handleOpenColumnModal(col)} onDelete={() => handleRemoveColumn(col.id)} />
                ))}
              </SortableContext>
            <div className="w-72 flex-shrink-0 space-y-2">
               <DialogTrigger asChild><Button variant="outline" className="w-full h-12" onClick={() => setIsTaskModalOpen(true)}><PlusCircle className="h-5 w-5 mr-2"/>Adicionar Tarefa</Button></DialogTrigger>
               <Button variant="outline" className="w-full h-12" onClick={() => handleOpenColumnModal(null)}><PlusCircle className="h-5 w-5 mr-2"/>Adicionar Nova Coluna</Button>
            </div>
          </div>
          <DragOverlay>{activeElement ? (activeElement.hasOwnProperty('columnId') ? <KanbanCard task={activeElement as Task} /> : <KanbanColumn column={activeElement as Column} tasks={tasks.filter(t => t.columnId === activeElement.id)} onEdit={() => {}} onDelete={() => {}} />) : null}</DragOverlay>
        </DndContext>
      </div>

       <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle><DialogDescription>Adicione uma nova tarefa ao backlog do projeto.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(handleAddTask)} className="space-y-4">
              <div><Label htmlFor="title">Título da Tarefa</Label><Input id="title" {...register("title")} />{errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="points">Story Points</Label><Input id="points" type="number" {...register("points")} /></div>
                  <div><Label htmlFor="tag">Tag/Tipo</Label><Controller name="tag" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{Object.keys(tagConfig).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>)}/></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="value">Valor do Projeto (R$)</Label><Input id="value" type="number" step="0.01" {...register("value")} /></div>
                  <div><Label htmlFor="delayCost">Custo do Atraso (R$/semana)</Label><Input id="delayCost" type="number" step="0.01" {...register("delayCost")} /></div>
                </div>
                <div><Label htmlFor="assignedTo">Atribuído a (nomes separados por vírgula)</Label><Input id="assignedTo" {...register("assignedTo")} placeholder="Ex: João, Maria" /></div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Adicionar Tarefa</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editingColumn ? 'Editar' : 'Adicionar'} Coluna</DialogTitle></DialogHeader>
            <form onSubmit={handleColumnSubmit(handleColumnAction)} className="space-y-4 py-2">
                <div><Label htmlFor="col-name">Nome da Coluna</Label><Input id="col-name" {...columnRegister("name")} autoFocus />{columnErrors.name && <p className="text-sm text-destructive mt-1">{columnErrors.name.message}</p>}</div>
                <div><Label htmlFor="col-wip">Limite WIP (Opcional)</Label><Input id="col-wip" type="number" placeholder="Deixe em branco para sem limite" {...columnRegister("wipLimit")} />{columnErrors.wipLimit && <p className="text-sm text-destructive mt-1">{columnErrors.wipLimit.message}</p>}</div>
                <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
