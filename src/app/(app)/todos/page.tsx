// src/app/(app)/todos/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, ListChecks } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const initialTodos: TodoItem[] = [
  { id: "todo_1", text: "Pagar fatura do cartão de crédito", completed: false },
  { id: "todo_2", text: "Revisar orçamento mensal", completed: true },
  { id: "todo_3", text: "Agendar consultoria financeira", completed: false },
];

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [newTodoText, setNewTodoText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TodoItem | null>(null);

  useEffect(() => {
    document.title = `Lista de Tarefas - ${APP_NAME}`;
  }, []);

  const handleAddTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newTodoText.trim() === "") {
      toast({ title: "Texto da Tarefa Vazio", description: "Por favor, insira um texto para a nova tarefa.", variant: "destructive" });
      return;
    }
    const newTodo: TodoItem = {
      id: `todo_${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
    };
    setTodos(prevTodos => [newTodo, ...prevTodos]);
    setNewTodoText("");
    toast({ title: "Tarefa Adicionada", description: `"${newTodo.text}" foi adicionada à sua lista.` });
  };

  const toggleTodoCompletion = (todoId: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteClick = (todo: TodoItem) => {
    setItemToDelete(todo);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== itemToDelete.id));
      toast({
        title: "Tarefa Deletada",
        description: `A tarefa "${itemToDelete.text}" foi deletada.`,
      });
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 100,
      },
    }),
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div>
      <PageHeader
        title="Lista de Tarefas"
        description="Organize suas pendências financeiras e outras tarefas importantes."
        icon={<ListChecks className="mr-2 h-6 w-6 text-primary" />}
      />

      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Adicionar Nova Tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTodo} className="flex gap-2">
            <Input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Ex: Transferir dinheiro para poupança"
              className="flex-grow"
            />
            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <motion.div layout className="space-y-4">
        {todos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma tarefa na lista. Adicione uma acima!</p>
        )}
        {todos.map((todo, index) => (
          <motion.div
            key={todo.id}
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <Card className={cn("shadow-sm hover:shadow-md transition-shadow", todo.completed && "bg-muted/50")}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-grow">
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodoCompletion(todo.id)}
                    aria-label={`Marcar tarefa ${todo.text} como ${todo.completed ? 'não concluída' : 'concluída'}`}
                  />
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={cn(
                      "flex-grow cursor-pointer text-sm",
                      todo.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {todo.text}
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteClick(todo)}
                  aria-label={`Deletar tarefa ${todo.text}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar a tarefa "{itemToDelete?.text}"?
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
