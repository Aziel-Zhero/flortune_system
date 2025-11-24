// src/app/(app)/todos/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListChecks, PlusCircle, Trash2, CalendarIcon, AlertTriangle, Edit3, Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import type { Todo } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSession } from "@/contexts/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTodos, addTodo, updateTodo, deleteTodo, type NewTodoData } from "@/services/todo.service";

const todoFormSchema = z.object({
  description: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres."),
  due_date: z.date().optional().nullable(),
});
type TodoFormData = z.infer<typeof todoFormSchema>;


export default function TodosPage() {
  const { session, isLoading: isAuthLoading } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<Todo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<TodoFormData>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: { description: "", due_date: null },
  });

  const fetchTodos = useCallback(async () => {
    if (!session?.user?.id) {
        setIsLoading(false);
        setTodos([]);
        return;
    }
    setIsLoading(true);
    const { data, error } = await getTodos(session.user.id);
    if (error) {
      toast({ title: "Erro ao buscar tarefas", description: error, variant: "destructive" });
    } else {
      const sortedTodos = (data || []).sort((a,b) => Number(a.is_completed) - Number(b.is_completed) || (a.due_date && b.due_date ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : a.due_date ? -1 : b.due_date ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() );
      setTodos(sortedTodos);
    }
    setIsLoading(false);
  }, [session?.user?.id]);
  
  useEffect(() => {
    document.title = `Lista de Tarefas - ${APP_NAME}`;
    if(!isAuthLoading) {
        fetchTodos();
    }
  }, [isAuthLoading, fetchTodos]);

  const onAddTodoSubmit: SubmitHandler<TodoFormData> = async (data) => {
    if(!session?.user?.id) return;
    setIsSubmitting(true);
    
    const newTodoData: NewTodoData = {
        description: data.description,
        due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
        is_completed: false,
    };
    
    const { data: newTodo, error } = await addTodo(session.user.id, newTodoData);
    
    if (error) {
        toast({ title: "Erro ao adicionar tarefa", description: error, variant: "destructive" });
    } else if (newTodo) {
        setTodos(prev => [newTodo, ...prev].sort((a,b) => Number(a.is_completed) - Number(b.is_completed) || (a.due_date && b.due_date ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : a.due_date ? -1 : b.due_date ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ));
        toast({ title: "Tarefa Adicionada!", description: `"${newTodo.description}" foi adicionada.` });
        reset();
    }
    setIsSubmitting(false);
  };

  const handleToggleComplete = async (todo: Todo) => {
    const originalTodos = [...todos];
    const updatedTodo = { ...todo, is_completed: !todo.is_completed };
    setTodos(prev => prev.map(t => t.id === todo.id ? updatedTodo : t).sort((a,b) => Number(a.is_completed) - Number(b.is_completed) || (a.due_date && b.due_date ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : a.due_date ? -1 : b.due_date ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ));
    const { error } = await updateTodo(todo.id, { is_completed: !todo.is_completed });
    if (error) {
        toast({ title: "Erro ao atualizar", description: error, variant: "destructive" });
        setTodos(originalTodos);
    }
  };

  const handleDeleteClick = (todo: Todo) => {
    setItemToDelete(todo);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await deleteTodo(itemToDelete.id);
    if (error) {
        toast({ title: "Erro ao deletar", description: error, variant: "destructive" });
    } else {
        setTodos(prev => prev.filter(t => t.id !== itemToDelete.id));
        toast({ title: "Tarefa Deletada", description: `"${itemToDelete.description}" foi deletada.` });
    }
    setItemToDelete(null);
  };
  
  const finalIsLoading = isAuthLoading || isLoading;

  if (finalIsLoading) {
    return (
      <div>
        <PageHeader title="Lista de Tarefas" description="Organize suas pendências." icon={<ListChecks />} />
        <Card className="shadow-lg mb-6">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-1/2" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 flex-grow" />
                <Skeleton className="h-8 w-8 rounded-sm" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Lista de Tarefas"
        description="Organize suas pendências financeiras e outras tarefas importantes."
        icon={<ListChecks className="mr-2 h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Adicionar Nova Tarefa</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onAddTodoSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Descrição da tarefa..."
                {...register("description")}
                aria-invalid={errors.description ? "true" : "false"}
              />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isClient && field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Data de Vencimento (Opcional)</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Adicionando..." : "Adicionar Tarefa"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Suas Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          {todos.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
              <p>Nenhuma tarefa encontrada. Adicione uma acima!</p>
            </div>
          )}
          {todos.length > 0 && (
            <ul className="space-y-3">
              {todos.map(todo => (
                <li
                  key={todo.id}
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-md transition-all",
                    todo.is_completed ? "bg-muted/50 opacity-70" : "bg-card hover:bg-muted/20"
                  )}
                >
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.is_completed}
                    onCheckedChange={() => handleToggleComplete(todo)}
                    className="h-5 w-5"
                  />
                  <div className="flex-grow">
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={cn(
                        "font-medium cursor-pointer",
                        todo.is_completed && "line-through text-muted-foreground"
                      )}
                    >
                      {todo.description}
                    </label>
                    {todo.due_date && (
                      <p className={cn(
                        "text-xs text-muted-foreground",
                        todo.is_completed && "line-through"
                      )}>
                        Vence em: {formatDate(todo.due_date)}
                      </p>
                    )}
                  </div>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => toast({ title: "Editar Tarefa", description: "Funcionalidade de edição em desenvolvimento."})}
                      disabled
                  >
                      <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(todo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar a tarefa "{itemToDelete?.description}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
