// src/app/(app)/dev/kanban/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KanbanSquare, PlusCircle, MessageSquare, Paperclip, CalendarIcon, MoreHorizontal } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  assignees: { id: string; name: string; avatarUrl?: string }[];
  comments: number;
  attachments: number;
  dueDate?: Date;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialData: Column[] = [
  {
    id: "col-1",
    title: "Backlog",
    tasks: [
      { id: "task-1", title: "Configurar autenticação OAuth com Google", assignees: [{id: 'u1', name: 'User 1'}], comments: 3, attachments: 1, dueDate: new Date() },
      { id: "task-2", title: "Desenvolver componente de calendário financeiro", assignees: [], comments: 0, attachments: 0 },
    ],
  },
  {
    id: "col-2",
    title: "Em Andamento",
    tasks: [
      { id: "task-3", title: "Criar página de dashboard com gráficos", assignees: [{id: 'u2', name: 'User 2'}], comments: 5, attachments: 2 },
    ],
  },
  {
    id: "col-3",
    title: "Concluído",
    tasks: [
      { id: "task-4", title: "Estruturar projeto Next.js com ShadCN", assignees: [{id: 'u1', name: 'User 1'}], comments: 1, attachments: 0 },
    ],
  },
];

const newColumnSchema = z.object({
  title: z.string().min(1, "O título da coluna é obrigatório."),
});
type NewColumnFormData = z.infer<typeof newColumnSchema>;

const newTaskSchema = z.object({
  title: z.string().min(1, "O título da tarefa é obrigatório."),
});
type NewTaskFormData = z.infer<typeof newTaskSchema>;

export default function DevKanbanPage() {
  const [columns, setColumns] = useState<Column[]>(initialData);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  
  const { register: registerColumn, handleSubmit: handleColumnSubmit, reset: resetColumnForm } = useForm<NewColumnFormData>({
    resolver: zodResolver(newColumnSchema),
  });

  const onAddColumn = (data: NewColumnFormData) => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: data.title,
      tasks: [],
    };
    setColumns(prev => [...prev, newColumn]);
    resetColumnForm();
    setIsColumnModalOpen(false);
    toast({ title: "Coluna Adicionada!", description: `A coluna "${data.title}" foi criada.` });
  };
  
  const AddTaskForm = ({ columnId }: { columnId: string }) => {
    const { register, handleSubmit, reset } = useForm<NewTaskFormData>({ resolver: zodResolver(newTaskSchema) });
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const onAddTask = (data: NewTaskFormData) => {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: data.title,
        assignees: [],
        comments: 0,
        attachments: 0,
      };
      setColumns(prev => prev.map(col => col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col));
      reset();
      setIsTaskModalOpen(false);
      toast({ title: "Tarefa Adicionada!", description: `A tarefa "${data.title}" foi adicionada.`});
    };
    
    return (
       <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogTrigger asChild>
           <Button variant="ghost" size="sm" className="w-full mt-2">
            <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Tarefa
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
                <DialogDescription>Adicione uma nova tarefa a esta coluna.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddTask)} className="space-y-4">
                <Textarea {...register("title")} placeholder="Descreva a tarefa..."/>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit">Adicionar Tarefa</Button>
                </DialogFooter>
            </form>
        </DialogContent>
       </Dialog>
    );
  };


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Quadro Kanban (DEV)"
        description="Visualize e gerencie o fluxo de trabalho de seus projetos de forma ágil e transparente."
        icon={<KanbanSquare className="h-6 w-6 text-primary" />}
        actions={
          <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Coluna
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Coluna</DialogTitle>
                <DialogDescription>Crie uma nova coluna para o seu quadro Kanban.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleColumnSubmit(onAddColumn)} className="space-y-4">
                <Input {...registerColumn("title")} placeholder="Título da Coluna (Ex: Testes)" />
                <DialogFooter>
                   <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                   <Button type="submit">Criar Coluna</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="flex-1 flex gap-4 overflow-x-auto p-1 pb-4">
        <AnimatePresence>
            {columns.map(column => (
            <motion.div 
                key={column.id} 
                layout 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-72 flex-shrink-0"
            >
                <Card className="bg-muted/40 h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-3">
                    <CardTitle className="font-headline text-base">{column.title}</CardTitle>
                    <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full">{column.tasks.length}</span>
                </CardHeader>
                <CardContent className="p-3 space-y-3 overflow-y-auto flex-grow">
                    <AnimatePresence>
                    {column.tasks.map(task => (
                        <motion.div 
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-3 space-y-2">
                            <p className="text-sm font-medium">{task.title}</p>
                            <div className="flex justify-between items-center text-muted-foreground">
                                <div className="flex items-center gap-2 text-xs">
                                {task.comments > 0 && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3"/>{task.comments}</span>}
                                {task.attachments > 0 && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3"/>{task.attachments}</span>}
                                {task.dueDate && <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3"/>{task.dueDate.toLocaleDateString('pt-BR')}</span>}
                                </div>
                                <div className="flex -space-x-2">
                                {task.assignees.map(user => (
                                    <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                ))}
                                </div>
                            </div>
                            </CardContent>
                        </Card>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </CardContent>
                <CardFooter className="p-2">
                   <AddTaskForm columnId={column.id} />
                </CardFooter>
                </Card>
            </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
