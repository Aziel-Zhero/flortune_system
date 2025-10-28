// src/app/(app)/dev/kanban/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, type DragStartEvent, type DragOverEvent, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

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
import { KanbanSquare, PlusCircle, Calendar, DollarSign, AlertTriangle, Settings, Trash2, Edit, Palette, HelpCircle } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { PrivateValue } from '@/components/shared/private-value';

// --- Tipos ---
interface Tag {
  id: string;
  name: string;
  colorClass: string;
}

interface Task {
  id: string;
  columnId: string;
  title: string;
  points?: number;
  assignedTo?: string;
  dueDate?: string;
  tagId?: string;
  value?: number;
  delayCost?: number;
  delayCostPeriod?: 'hora' | 'dia' | 'semana' | 'quinzenal' | 'mensal';
}

interface Column {
  id: string;
  name: string;
  wipLimit?: number;
  colorClass?: string;
}

const taskSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  points: z.coerce.number().optional(),
  assignedTo: z.string().optional(),
  value: z.coerce.number().optional(),
  delayCost: z.coerce.number().optional(),
  delayCostPeriod: z.enum(['hora', 'dia', 'semana', 'quinzenal', 'mensal']).optional(),
  tagId: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskSchema>;

const columnSchema = z.object({
  name: z.string().min(2, "O nome da coluna é obrigatório."),
  wipLimit: z.coerce.number().min(0, "O limite não pode ser negativo.").optional(),
  colorClass: z.string().optional(),
});
type ColumnFormData = z.infer<typeof columnSchema>;

const newTagSchema = z.object({
  name: z.string().min(2, "O nome da tag é obrigatório."),
  colorClass: z.string().min(1, "A cor da tag é obrigatória."),
});
type NewTagFormData = z.infer<typeof newTagSchema>;

// --- Configurações e Dados Iniciais ---
const columnColors = [
    { name: "Padrão", value: "bg-muted/50" },
    { name: "Vermelho", value: "bg-red-500/20" },
    { name: "Laranja", value: "bg-orange-500/20" },
    { name: "Amarelo", value: "bg-yellow-500/20" },
    { name: "Verde", value: "bg-green-500/20" },
    { name: "Azul", value: "bg-blue-500/20" },
    { name: "Roxo", value: "bg-purple-500/20" },
];

const initialTags: Tag[] = [
    { id: 'tag-1', name: 'Frontend', colorClass: 'bg-green-200 text-green-800 border-green-400 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' },
    { id: 'tag-2', name: 'Backend', colorClass: 'bg-blue-200 text-blue-800 border-blue-400 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700' },
    { id: 'tag-3', name: 'Infra', colorClass: 'bg-purple-200 text-purple-800 border-purple-400 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700' },
    { id: 'tag-4', name: 'Bug', colorClass: 'bg-red-200 text-red-800 border-red-400 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700' },
];

const initialColumns: Column[] = [
  { id: 'backlog', name: 'Backlog de Espera' },
  { id: 'todo', name: 'A Fazer', wipLimit: 5, colorClass: "bg-blue-500/10" },
  { id: 'doing', name: 'Em Andamento', wipLimit: 3, colorClass: "bg-yellow-500/10" },
  { id: 'done', name: 'Concluído', colorClass: "bg-green-500/10" },
];

const initialTasks: Task[] = [
    { id: '1', columnId: 'backlog', title: 'Configurar autenticação OAuth', points: 3, dueDate: '2025-07-25', assignedTo: 'João S.', tagId: 'tag-2', value: 1500, delayCost: 100, delayCostPeriod: 'dia' },
    { id: '2', columnId: 'todo', title: 'Desenvolver componente de calendário', points: 5, dueDate: '2025-07-28', assignedTo: 'Maria P.', tagId: 'tag-1', value: 2500, delayCost: 150, delayCostPeriod: 'semana' },
    { id: '3', columnId: 'doing', title: 'Criar página de dashboard com gráficos', points: 8, dueDate: '2025-08-02', assignedTo: 'Lucas C., Ana S.', tagId: 'tag-1', value: 4000, delayCost: 50, delayCostPeriod: 'hora' },
    { id: '4', columnId: 'done', title: 'Estruturar projeto Next.js com ShadCN', points: 2, dueDate: '2025-07-20', assignedTo: 'Ana S.', tagId: 'tag-3', value: 1000, delayCost: 50, delayCostPeriod: 'dia' },
];

// --- Sub-componentes ---
const KanbanCard: React.FC<{ task: Task; tags: Tag[] }> = ({ task, tags }) => {
  const { title, points, assignedTo, dueDate, tagId, value, delayCost, delayCostPeriod } = task;
  const tag = tags.find(t => t.id === tagId);
  const assignees = assignedTo?.split(',').map(name => name.trim()).filter(Boolean);

  return (
    <div className="bg-card rounded-md shadow-sm border p-3 mb-2 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
      <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
        {(value !== undefined || delayCost !== undefined) && (
             <div className="flex items-center justify-between">
                {value !== undefined && <div className="flex items-center gap-1" title="Valor da tarefa"><DollarSign className="h-3 w-3 text-green-500" /><span className='font-medium text-green-600'><PrivateValue value={value.toLocaleString('pt-BR')} /></span></div>}
                {delayCost !== undefined && <div className="flex items-center gap-1" title="Custo do Atraso"><AlertTriangle className="h-3 w-3 text-red-500" /><span className='font-medium text-red-600'><PrivateValue value={delayCost.toLocaleString('pt-BR')} />/{delayCostPeriod?.charAt(0)}</span></div>}
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
            {tag && (<span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tag.colorClass)}>{tag.name}</span>)}
            </div>
        </div>
      </div>
    </div>
  );
};

const SortableKanbanCard: React.FC<{ task: Task, tags: Tag[] }> = ({ task, tags }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task }});
    const style = { transform: CSS.Translate.toString(transform), transition };
    
    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="bg-card rounded-md shadow-sm border p-3 mb-2 opacity-50 h-[100px]"></div>;
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <KanbanCard task={task} tags={tags} />
        </div>
    );
}

const KanbanColumn: React.FC<{ column: Column; tasks: Task[]; tags: Tag[]; onEdit: () => void; onDelete: () => void; }> = ({ column, tasks, tags, onEdit, onDelete }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: column.id, data: { type: 'Column', column } });
    const style = { transform: CSS.Translate.toString(transform), transition };
    const tasksCount = tasks.length;
    const isWipExceeded = column.wipLimit !== undefined && tasksCount > column.wipLimit;

    const tasksIds = useMemo(() => tasks.map(t => t.id), [tasks]);

    return (
      <div ref={setNodeRef} style={style} className={cn("w-80 rounded-lg flex flex-col flex-shrink-0 max-h-[calc(100vh-16rem)]", column.colorClass || 'bg-muted/50', isDragging && "opacity-30")}>
        <div {...attributes} {...listeners} className={cn("flex justify-between items-center mb-3 px-3 pt-3 pb-1 cursor-grab active:cursor-grabbing", isWipExceeded && "bg-red-500/40 rounded-t-lg")}>
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
        <div className="flex-1 p-3 pt-0 rounded-md overflow-y-auto">
          <SortableContext items={tasksIds}>
            {tasks.map(task => <SortableKanbanCard key={task.id} task={task} tags={tags} />)}
          </SortableContext>
        </div>
      </div>
    );
}

// --- Main Page Component ---
export default function DevKanbanPage() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [activeElement, setActiveElement] = useState<Task | Column | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // --- LocalStorage Logic ---
  useEffect(() => {
    setIsClient(true);
    try {
      const storedColumns = localStorage.getItem('kanban-columns');
      const storedTasks = localStorage.getItem('kanban-tasks');
      const storedTags = localStorage.getItem('kanban-tags');
      if (storedColumns) setColumns(JSON.parse(storedColumns));
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedTags) setTags(JSON.parse(storedTags));
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('kanban-columns', JSON.stringify(columns));
      localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
      localStorage.setItem('kanban-tags', JSON.stringify(tags));
    }
  }, [columns, tasks, tags, isClient]);

  // --- Modal States ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // --- Form Hooks ---
  const { register: taskRegister, handleSubmit: handleTaskSubmit, control: taskControl, reset: resetTaskForm, formState: { errors: taskErrors } } = useForm<TaskFormData>({ resolver: zodResolver(taskSchema) });
  const { register: columnRegister, handleSubmit: handleColumnSubmit, reset: resetColumnForm, control: columnControl, formState: { errors: columnErrors } } = useForm<ColumnFormData>({ resolver: zodResolver(columnSchema) });
  const { register: tagRegister, handleSubmit: handleTagSubmit, reset: resetTagForm, control: tagControl, formState: { errors: tagErrors } } = useForm<NewTagFormData>({ resolver: zodResolver(newTagSchema) });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') setActiveElement(event.active.data.current.task);
    if (event.active.data.current?.type === 'Column') setActiveElement(event.active.data.current.column);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const isActiveATask = active.data.current?.type === "Task";
    if (!isActiveATask) return;

    const isOverAColumn = over.data.current?.type === "Column";
    if (isOverAColumn) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === active.id);
            if (currentTasks[activeIndex].columnId !== over.id) {
                currentTasks[activeIndex].columnId = over.id as string;
                return arrayMove(currentTasks, activeIndex, activeIndex);
            }
            return currentTasks;
        });
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveElement(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (isActiveAColumn) {
      setColumns(currentCols => {
        const oldIndex = currentCols.findIndex(c => c.id === active.id);
        const newIndex = currentCols.findIndex(c => c.id === over.id);
        return arrayMove(currentCols, oldIndex, newIndex);
      });
      return;
    }
    
    const isActiveATask = active.data.current?.type === "Task";
    if (isActiveATask) {
        setTasks(currentTasks => {
            const activeIndex = currentTasks.findIndex(t => t.id === active.id);
            const overIndex = currentTasks.findIndex(t => t.id === over.id);
            if (currentTasks[activeIndex].columnId !== currentTasks[overIndex].columnId) {
                currentTasks[activeIndex].columnId = currentTasks[overIndex].columnId;
            }
            return arrayMove(currentTasks, activeIndex, overIndex);
        })
    }
  }

  const handleAddTask: SubmitHandler<TaskFormData> = (data) => {
    const newTask: Task = {
      id: `task_${Date.now()}`, columnId: 'backlog', title: data.title, points: data.points,
      assignedTo: data.assignedTo, tagId: data.tagId, value: data.value, delayCost: data.delayCost, delayCostPeriod: data.delayCostPeriod,
    };
    setTasks(current => [newTask, ...current]);
    toast({ title: "Tarefa Adicionada!", description: `"${data.title}" foi adicionada ao Backlog de Espera.`});
    resetTaskForm({ title: "", points: undefined, assignedTo: "" });
    setIsTaskModalOpen(false);
  };
  
  const handleOpenColumnModal = (column: Column | null = null) => {
    setEditingColumn(column);
    resetColumnForm(column || { name: "", wipLimit: undefined, colorClass: "bg-muted/50" });
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
  
  const handleAddTag: SubmitHandler<NewTagFormData> = (data) => {
      const newTag: Tag = { id: `tag_${Date.now()}`, name: data.name, colorClass: data.colorClass };
      setTags(prev => [...prev, newTag]);
      toast({ title: "Tag Adicionada", description: `A tag "${data.name}" foi criada.`});
      resetTagForm();
      setIsTagModalOpen(false);
  }

  return (
    <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
            <div className="flex flex-col h-full">
              <PageHeader 
                title="Quadro Kanban" 
                description="Visualize e gerencie o fluxo de trabalho. Arraste e solte tarefas e colunas." 
                icon={<KanbanSquare />}
                actions={<>
                  <Button variant="outline" onClick={() => setIsTaskModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Tarefa</Button>
                  <Button variant="outline" onClick={() => handleOpenColumnModal(null)}><PlusCircle className="mr-2 h-4 w-4"/>Nova Coluna</Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsHelpModalOpen(true)}><HelpCircle className="h-5 w-5"/></Button>
                </>}
              />
              {isClient && (
                <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetection={closestCorners}>
                  <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                      <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                        {columns.map(col => (
                          <KanbanColumn key={col.id} column={col} tags={tags} tasks={tasks.filter(t => t.columnId === col.id)} onEdit={() => handleOpenColumnModal(col)} onDelete={() => handleRemoveColumn(col.id)} />
                        ))}
                      </SortableContext>
                  </div>
                  <DragOverlay>{activeElement ? (activeElement.hasOwnProperty('columnId') ? <KanbanCard task={activeElement as Task} tags={tags} /> : <KanbanColumn column={activeElement as Column} tasks={tasks.filter(t => t.columnId === activeElement.id)} tags={tags} onEdit={() => {}} onDelete={() => {}} />) : null}</DragOverlay>
                </DndContext>
              )}
            </div>
            
            {/* Task Modal */}
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle><DialogDescription>Adicione uma nova tarefa ao backlog do projeto.</DialogDescription></DialogHeader>
              <form onSubmit={handleTaskSubmit(handleAddTask)} className="space-y-4">
                  <div><Label htmlFor="title">Título da Tarefa</Label><Input id="title" {...taskRegister("title")} />{taskErrors.title && <p className="text-sm text-destructive mt-1">{taskErrors.title.message}</p>}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="points">Story Points</Label><Input id="points" type="number" {...taskRegister("points")} /></div>
                      <div><Label htmlFor="tagId">Tag/Tipo</Label>
                        <div className="flex gap-2">
                          <Controller name="tagId" control={taskControl} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{tags.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>)}/>
                          <DialogTrigger asChild><Button type="button" variant="outline" size="icon" onClick={() => setIsTagModalOpen(true)}><Palette className="h-4 w-4"/></Button></DialogTrigger>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div><Label htmlFor="value">Valor do Projeto (R$)</Label><Input id="value" type="number" step="0.01" {...taskRegister("value")} /></div>
                        <div><Label htmlFor="delayCost">Custo do Atraso (R$)</Label><Input id="delayCost" type="number" step="0.01" {...taskRegister("delayCost")} /></div>
                    </div>
                    <div className="grid grid-cols-1">
                        <div><Label htmlFor="delayCostPeriod">Período do Custo de Atraso</Label><Controller name="delayCostPeriod" control={taskControl} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="hora">por Hora</SelectItem><SelectItem value="dia">por Dia</SelectItem><SelectItem value="semana">por Semana</SelectItem><SelectItem value="quinzenal">por Quinzena</SelectItem><SelectItem value="mensal">por Mês</SelectItem></SelectContent></Select>)}/></div>
                    </div>
                    <div><Label htmlFor="assignedTo">Atribuído a (nomes separados por vírgula)</Label><Input id="assignedTo" {...taskRegister("assignedTo")} placeholder="Ex: João, Maria" /></div>
                  <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Adicionar Tarefa</Button></DialogFooter>
              </form>
            </DialogContent>
            
            {/* Column Modal */}
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{editingColumn ? 'Editar' : 'Adicionar'} Coluna</DialogTitle></DialogHeader>
                <form onSubmit={handleColumnSubmit(handleColumnAction)} className="space-y-4 py-2">
                    <div><Label htmlFor="col-name">Nome da Coluna</Label><Input id="col-name" {...columnRegister("name")} autoFocus />{columnErrors.name && <p className="text-sm text-destructive mt-1">{columnErrors.name.message}</p>}</div>
                    <div><Label htmlFor="col-wip">Limite WIP (Opcional)</Label><Input id="col-wip" type="number" placeholder="Deixe em branco para sem limite" {...columnRegister("wipLimit")} />{columnErrors.wipLimit && <p className="text-sm text-destructive mt-1">{columnErrors.wipLimit.message}</p>}</div>
                    <div>
                      <Label>Cor da Coluna</Label>
                      <Controller name="colorClass" control={columnControl} render={({field}) => (
                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {columnColors.map(color => (
                            <button key={color.value} type="button" onClick={() => field.onChange(color.value)} className={cn("h-8 rounded-md border-2", field.value === color.value ? "border-primary ring-2 ring-primary" : "border-transparent", color.value)}></button>
                          ))}
                        </div>
                      )} />
                    </div>
                    <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
                </form>
            </DialogContent>
            
            {/* Tag Modal */}
            <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
              <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Criar Nova Tag</DialogTitle></DialogHeader>
                    <form onSubmit={handleTagSubmit(handleAddTag)} className="space-y-4">
                        <div><Label htmlFor="tag-name">Nome da Tag</Label><Input id="tag-name" {...tagRegister("name")} />{tagErrors.name && <p className="text-sm text-destructive mt-1">{tagErrors.name.message}</p>}</div>
                        <div>
                            <Label>Cor da Tag</Label>
                            <Controller name="colorClass" control={tagControl} render={({field}) => (
                                <div className="grid grid-cols-5 gap-2 pt-2">
                                    {Object.values(initialTags).map(tag => (
                                        <button key={tag.id} type="button" onClick={() => field.onChange(tag.colorClass)} className={cn("h-8 rounded-md border-2", field.value === tag.colorClass ? "border-primary ring-2 ring-primary" : "border-transparent", tag.colorClass)}></button>
                                    ))}
                                </div>
                            )} />
                            {tagErrors.colorClass && <p className="text-sm text-destructive mt-1">{tagErrors.colorClass.message}</p>}
                        </div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Criar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Help Modal */}
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline flex items-center"><HelpCircle className="h-5 w-5 mr-2 text-primary"/>Guia de Uso do Quadro Kanban</DialogTitle>
                <DialogDescription>Entenda os conceitos e como usar esta ferramenta para maximizar sua produtividade.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6 text-sm text-muted-foreground max-h-[70vh] overflow-y-auto pr-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">O que é Kanban?</h4>
                    <p>Kanban é um método para gerenciar o fluxo de trabalho. Seu principal objetivo é visualizar o trabalho, limitar o trabalho em andamento (WIP) e maximizar a eficiência. Em vez de planejar iterações fixas como no Scrum, o Kanban foca no fluxo contínuo de entrega de valor.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Funcionalidades Implementadas</h4>
                    <ul className="list-disc list-inside space-y-3">
                        <li>
                            <strong>Colunas Personalizadas:</strong> Você pode adicionar, renomear e reordenar as colunas para mapear seu fluxo de trabalho real. Use o botão "Adicionar Nova Coluna" ou a engrenagem em cada coluna para gerenciá-las.
                        </li>
                        <li>
                            <strong>Limite WIP (Work In Progress):</strong> Ao editar uma coluna, você pode definir um "Limite WIP". Quando o número de tarefas na coluna excede esse limite, o cabeçalho fica vermelho. Isso é um sinal visual para a equipe parar de iniciar novas tarefas e focar em finalizar o que já está em andamento, resolvendo gargalos.
                        </li>
                        <li>
                            <strong>Priorização por Valor e Urgência:</strong> Ao criar uma tarefa, você pode definir o "Valor do Projeto" (o benefício de concluí-la) e o "Custo do Atraso" (quanto custa não fazer a tarefa por um período). Tarefas com alto Custo de Atraso devem ser priorizadas. Esta é uma técnica poderosa para tomar decisões econômicas.
                        </li>
                        <li>
                            <strong>Tags e Cores:</strong> Use as tags para categorizar suas tarefas (ex: "Bug", "Melhoria", "Infra"). Você pode criar novas tags e associar cores a elas, melhorando a organização visual do seu quadro.
                        </li>
                        <li>
                            <strong>Atribuição Múltipla:</strong> O campo "Atribuído a" aceita múltiplos nomes separados por vírgula, ideal para tarefas que envolvem trabalho em par ou em equipe.
                        </li>
                    </ul>
                </div>
                <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-semibold text-foreground">Como Começar?</h4>
                    <p>1. **Mapeie seu Fluxo:** Adicione e renomeie as colunas para representar as etapas do seu processo (Ex: Ideias, A Fazer, Desenvolvendo, Testando, Concluído).</p>
                    <p>2. **Defina Limites WIP:** Comece com limites baixos para as colunas "em andamento". Por exemplo, não mais que 1 ou 2 tarefas por pessoa na equipe.</p>
                    <p>3. **Adicione Tarefas:** Preencha o backlog com suas tarefas. Tente estimar o Valor e o Custo do Atraso para as mais importantes.</p>
                    <p>4. **Puxe o Trabalho:** Em vez de "empurrar" trabalho, puxe a próxima tarefa mais importante do "A Fazer" para "Em Andamento" apenas quando houver capacidade (abaixo do limite WIP).</p>
                    <p>5. **Observe e Melhore:** Use o quadro para identificar onde as tarefas estão parando. O objetivo é manter o fluxo suave e contínuo.</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button>Entendi</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </Dialog>
    </Dialog>
  );
}
