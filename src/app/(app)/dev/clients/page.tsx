// src/app/(app)/dev/clients/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users2, PlusCircle, Edit, Trash2, Download, Circle, Search, Filter, FileJson, FileCsv, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

// --- Tipos e Dados ---
type ClientStatus = 'planning' | 'in_progress' | 'delivered' | 'on_hold' | 'delayed';
type ClientPriority = 'low' | 'medium' | 'high';

interface Client {
  id: string;
  name: string;
  serviceType: string;
  status: ClientStatus;
  startDate: string;
  deadline: string;
  priority: ClientPriority;
  notes: string;
  tasks: string;
}

const clientSchema = z.object({
  name: z.string().min(2, "O nome do cliente/projeto é obrigatório."),
  serviceType: z.string().min(2, "O tipo de serviço é obrigatório."),
  status: z.enum(['planning', 'in_progress', 'delivered', 'on_hold', 'delayed']),
  startDate: z.string().refine(v => v, { message: "Data de início é obrigatória." }),
  deadline: z.string().refine(v => v, { message: "Data de entrega é obrigatória." }),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional().default(""),
  tasks: z.string().optional().default(""),
}).refine(data => new Date(data.deadline) >= new Date(data.startDate), {
  message: "A data de entrega não pode ser anterior à data de início.",
  path: ["deadline"],
});

type ClientFormData = z.infer<typeof clientSchema>;

const statusConfig: Record<ClientStatus, { label: string; color: string; iconColor: string }> = {
  planning: { label: 'Planejamento', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600', iconColor: 'bg-gray-400' },
  in_progress: { label: 'Em Execução', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700', iconColor: 'bg-blue-500' },
  delivered: { label: 'Entregue', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700', iconColor: 'bg-green-500' },
  on_hold: { label: 'Em Espera', color: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600', iconColor: 'bg-yellow-400' },
  delayed: { label: 'Atrasado', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700', iconColor: 'bg-red-500' },
};

const priorityConfig: Record<ClientPriority, { label: string, color: string }> = {
  low: { label: 'Baixa', color: 'text-gray-500' },
  medium: { label: 'Média', color: 'text-yellow-500' },
  high: { label: 'Alta', color: 'text-red-500' },
};

export default function DevClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");


  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });
  
  useEffect(() => {
    document.title = `Clientes & Projetos (DEV) - ${APP_NAME}`;
    try {
        const storedClients = localStorage.getItem("flortune-dev-clients");
        if (storedClients) {
            setClients(JSON.parse(storedClients));
        }
    } catch (e) { console.error("Falha ao carregar clientes do localStorage", e); }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem("flortune-dev-clients", JSON.stringify(clients));
    } catch(e) { console.error("Falha ao salvar clientes no localStorage", e); }
  }, [clients]);
  
  const filteredClients = useMemo(() => {
      return clients
        .filter(client => {
          if (statusFilter !== 'all' && client.status !== statusFilter) return false;
          if (priorityFilter !== 'all' && client.priority !== priorityFilter) return false;
          if (searchTerm && !client.name.toLowerCase().includes(searchTerm.toLowerCase()) && !client.serviceType.toLowerCase().includes(searchTerm.toLowerCase())) return false;
          return true;
        });
    }, [clients, searchTerm, statusFilter, priorityFilter]);
    
  const clientSummary = useMemo(() => {
    return clients.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
    }, {} as Record<ClientStatus | 'total', number>);
  }, [clients]);

  const handleOpenForm = (client: Client | null = null) => {
    setEditingClient(client);
    if (client) {
      reset(client);
    } else {
      reset({
        name: "", serviceType: "", status: "planning", priority: "medium",
        startDate: format(new Date(), 'yyyy-MM-dd'), deadline: format(new Date(), 'yyyy-MM-dd'),
        notes: "", tasks: "",
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<ClientFormData> = (data) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...data } : c));
      toast({ title: "Cliente Atualizado!", description: `"${data.name}" foi atualizado com sucesso.` });
    } else {
      const newClient: Client = { ...data, id: `client_${Date.now()}` };
      setClients(prev => [newClient, ...prev]);
      toast({ title: "Cliente Adicionado!", description: `"${data.name}" foi adicionado.` });
    }
    setIsFormOpen(false);
    setEditingClient(null);
  };
  
  const handleConfirmDelete = () => {
    if (clientToDelete) {
        setClients(clients.filter(c => c.id !== clientToDelete.id));
        toast({ title: "Cliente Deletado", variant: "destructive"});
        setClientToDelete(null);
    }
  };
  
   const escapeCSV = (str: string | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return `"${s}"`;
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast({ title: "Nenhum dado para exportar", variant: "destructive" });
      return;
    }
    const headers = ["ID", "Nome", "Tipo de Servico", "Status", "Data de Inicio", "Prazo", "Prioridade", "Anotacoes", "Tarefas"];
    const csvContent = [
      headers.join(','),
      ...clients.map(c => [
        escapeCSV(c.id), escapeCSV(c.name), escapeCSV(c.serviceType),
        escapeCSV(c.status), escapeCSV(c.startDate), escapeCSV(c.deadline),
        escapeCSV(c.priority), escapeCSV(c.notes), escapeCSV(c.tasks)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement('a');
    if(link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `flortune_clients_backup_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Exportação CSV Iniciada", description: "O arquivo será baixado."});
    } else {
       toast({ title: "Exportação falhou", description: "Seu navegador não suporta a exportação de arquivos.", variant: "destructive" });
    }
  };

  const handleExportJSON = () => {
    if (clients.length === 0) {
      toast({ title: "Nenhum dado para exportar", variant: "destructive" });
      return;
    }
    const dataStr = JSON.stringify(clients, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flortune_clients_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Exportação JSON Iniciada", description: "O arquivo será baixado."});
  };

  return (
    <>
      <PageHeader
        title="Clientes & Projetos (DEV)"
        description="Gerencie seus clientes, projetos, prazos e anotações."
        icon={<Users2 className="h-6 w-6 text-primary" />}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline"><Download className="mr-2 h-4 w-4"/>Exportar</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportJSON}><FileJson className="mr-2 h-4 w-4"/>Exportar JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}><FileCsv className="mr-2 h-4 w-4"/>Exportar CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Cliente</Button>
          </div>
        }
      />
      
       <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Buscar por nome ou serviço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><div className="flex items-center gap-2"><Filter className="h-4 w-4"/>Status: {statusFilter === 'all' ? 'Todos' : statusConfig[statusFilter as ClientStatus].label}</div></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos os Status</SelectItem>{Object.entries(statusConfig).map(([key, {label}]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
          </Select>
           <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger><div className="flex items-center gap-2"><Filter className="h-4 w-4"/>Prioridade: {priorityFilter === 'all' ? 'Todas' : priorityConfig[priorityFilter as ClientPriority].label}</div></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas as Prioridades</SelectItem>{Object.entries(priorityConfig).map(([key, {label}]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </Card>

      {clients.length > 0 && (
         <Card className="mb-6">
            <CardHeader><CardTitle className="font-headline text-lg">Resumo de Projetos</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 font-medium">Total: <span className="text-xl font-bold">{clientSummary.total || 0}</span></div>
                {Object.entries(clientSummary).filter(([key]) => key !== 'total').map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2"><Circle className={cn("h-3 w-3", statusConfig[status as ClientStatus].iconColor)}/>{statusConfig[status as ClientStatus].label}: <span className="font-bold">{count}</span></div>
                ))}
            </CardContent>
         </Card>
      )}
      
      {filteredClients.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                <CardTitle className="mt-4">Nenhum resultado encontrado</CardTitle>
                <CardDescription>Tente ajustar seus filtros ou adicione um novo cliente.</CardDescription>
            </CardHeader>
            <CardContent><Button onClick={() => handleOpenForm()}>Adicionar Novo Cliente</Button></CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
                <Card key={client.id} className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="font-headline text-lg">{client.name}</CardTitle>
                             <Badge variant="outline" className={cn(statusConfig[client.status].color, "whitespace-nowrap")}>
                                <Circle className={cn("mr-2 h-2 w-2", statusConfig[client.status].iconColor)}/>
                                {statusConfig[client.status].label}
                            </Badge>
                        </div>
                        <CardDescription>{client.serviceType}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm flex-grow">
                        <p className="flex items-center gap-1"><strong>Prioridade:</strong> <span className={cn(priorityConfig[client.priority].color, 'font-semibold')}>{priorityConfig[client.priority].label}</span></p>
                        <p><strong>Início:</strong> {format(parseISO(client.startDate), "dd/MM/yyyy")}</p>
                        <p><strong>Entrega:</strong> {format(parseISO(client.deadline), "dd/MM/yyyy")}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenForm(client)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                        <Button variant="destructive-outline" size="sm" onClick={() => setClientToDelete(client)}><Trash2 className="mr-2 h-4 w-4"/>Excluir</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}

      {/* --- Diálogo de Adicionar/Editar --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingClient ? "Editar Cliente/Projeto" : "Adicionar Novo Cliente/Projeto"}</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="name">Nome Cliente/Projeto</Label><Input id="name" {...register("name")} />{errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}</div>
                <div><Label htmlFor="serviceType">Tipo de Serviço</Label><Input id="serviceType" {...register("serviceType")} placeholder="Ex: Website, API, Automação" />{errors.serviceType && <p className="text-sm text-destructive mt-1">{errors.serviceType.message}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="startDate">Data de Início</Label><Input id="startDate" type="date" {...register("startDate")} />{errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}</div>
                <div><Label htmlFor="deadline">Data de Entrega</Label><Input id="deadline" type="date" {...register("deadline")} />{errors.deadline && <p className="text-sm text-destructive mt-1">{errors.deadline.message}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="status">Status</Label><Controller name="status" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="status"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(statusConfig).map(([key, {label}]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent></Select>)}/>{errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}</div>
                <div><Label htmlFor="priority">Prioridade</Label><Controller name="priority" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="priority"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(priorityConfig).map(([key, {label}]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent></Select>)}/>{errors.priority && <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>}</div>
            </div>
            <div><Label htmlFor="tasks">Lista de Tarefas</Label><Textarea id="tasks" {...register("tasks")} placeholder="- Tarefa 1&#10;- Tarefa 2" rows={4}/></div>
            <div><Label htmlFor="notes">Anotações</Label><Textarea id="notes" {...register("notes")} placeholder="Decisões, pendências, etc." rows={4}/></div>
            <DialogFooter className="sticky bottom-0 bg-background pt-4 -mb-4 -mx-1 px-1">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* --- Diálogo de Exclusão --- */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir "{clientToDelete?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({variant: "destructive"})}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
