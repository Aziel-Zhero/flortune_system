
// src/app/(app)/dev/clients/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, type FC } from "react";
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
  DialogTrigger
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
import { Users2, PlusCircle, Edit, Trash2, Download, Circle, Search, Filter, FileJson, FileCsv, AlertTriangle, Calculator, DollarSign } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { PrivateValue } from "@/components/shared/private-value";

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

// --- Componentes ---
interface PricingFormState { hourlyRate: string; estimatedHours: string; complexity: "low" | "medium" | "high"; }
const complexityFactors = { low: 1.0, medium: 1.25, high: 1.5 };

const ProjectPricingCalculator: FC = () => {
    const [formState, setFormState] = useState<PricingFormState>({ hourlyRate: "50", estimatedHours: "10", complexity: "medium" });
    const [totalPrice, setTotalPrice] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormState(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSelectChange = (value: PricingFormState['complexity']) => { setFormState(prev => ({ ...prev, complexity: value })); };

    const calculatePrice = useCallback(() => {
        const hr = parseFloat(formState.hourlyRate) || 0;
        const eh = parseFloat(formState.estimatedHours) || 0;
        const factor = complexityFactors[formState.complexity];
        if (hr <= 0 || eh <= 0) { toast({ title: "Valores Inválidos", variant: "destructive" }); setTotalPrice(null); return; }
        const finalPrice = (hr * eh * factor);
        setTotalPrice(finalPrice);
    }, [formState]);

    return (
        <Card className="shadow-inner bg-muted/50">
            <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><Calculator/>Calculadora Rápida</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label htmlFor="calc-hourlyRate">Valor/Hora (R$)</Label><Input type="number" id="calc-hourlyRate" name="hourlyRate" value={formState.hourlyRate} onChange={handleInputChange} placeholder="50" /></div>
                    <div><Label htmlFor="calc-estimatedHours">Horas Estimadas</Label><Input type="number" id="calc-estimatedHours" name="estimatedHours" value={formState.estimatedHours} onChange={handleInputChange} placeholder="10" /></div>
                </div>
                <div><Label htmlFor="calc-complexity">Complexidade</Label><Select name="complexity" value={formState.complexity} onValueChange={(val) => handleSelectChange(val as any)}><SelectTrigger id="calc-complexity"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent></Select></div>
                {totalPrice !== null && (<div className="mt-4 p-3 bg-primary/10 rounded-md text-center"><p className="text-sm text-muted-foreground">Preço Estimado:</p><p className="text-2xl font-bold text-primary"><PrivateValue value={totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p></div>)}
            </CardContent>
            <CardFooter><Button onClick={calculatePrice} className="w-full">Calcular</Button></CardFooter>
        </Card>
    );
};

// --- Página Principal ---
export default function DevClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ClientFormData>({ resolver: zodResolver(clientSchema), });
  
  useEffect(() => {
    document.title = `Clientes & Projetos (DEV) - ${APP_NAME}`;
    try { const stored = localStorage.getItem("flortune-dev-clients"); if (stored) setClients(JSON.parse(stored)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { try { localStorage.setItem("flortune-dev-clients", JSON.stringify(clients)); } catch(e) { console.error(e); } }, [clients]);
  
  const filteredClients = useMemo(() => clients.filter(c => (statusFilter === 'all' || c.status === statusFilter) && (priorityFilter === 'all' || c.priority === priorityFilter) && (!searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))), [clients, searchTerm, statusFilter, priorityFilter]);
    
  const clientSummary = useMemo(() => clients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; acc.total = (acc.total || 0) + 1; return acc; }, {} as Record<ClientStatus | 'total', number>), [clients]);

  const handleOpenForm = useCallback((client: Client | null = null) => {
    setEditingClient(client);
    reset(client || { name: "", serviceType: "", status: "planning", priority: "medium", startDate: format(new Date(), 'yyyy-MM-dd'), deadline: format(new Date(), 'yyyy-MM-dd'), notes: "", tasks: "" });
    setIsFormOpen(true);
  }, [reset]);

  const onSubmit: SubmitHandler<ClientFormData> = useCallback((data) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...data } : c));
      toast({ title: "Cliente Atualizado!" });
    } else {
      setClients(prev => [{ ...data, id: `client_${Date.now()}` }, ...prev]);
      toast({ title: "Cliente Adicionado!" });
    }
    setIsFormOpen(false);
  }, [clients, editingClient]);
  
  const handleConfirmDelete = useCallback(() => { 
    if (clientToDelete) { 
      setClients(c => c.filter(c => c.id !== clientToDelete.id)); 
      toast({ title: "Cliente Deletado", variant: "destructive" }); 
      setClientToDelete(null); 
    } 
  }, [clientToDelete]);
  
  const handleExport = useCallback((type: 'csv' | 'json') => {
    if (clients.length === 0) { toast({ title: "Nenhum dado para exportar", variant: "destructive" }); return; }
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace(/[:.]/g, "-");
    const fileContent = type === 'json' ? JSON.stringify(clients, null, 2) : ["ID,Nome,Tipo,Status,Inicio,Prazo,Prioridade,Anotacoes,Tarefas", ...clients.map(c => [c.id, c.name, c.serviceType, c.status, c.startDate, c.deadline, c.priority, `"${c.notes.replace(/"/g, '""')}"`, `"${c.tasks.replace(/"/g, '""')}"`].join(','))].join('\n');
    const blob = new Blob([type === 'csv' ? `\uFEFF${fileContent}` : fileContent], { type: type === 'csv' ? "text/csv;charset=utf-8;" : "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `flortune_clients_${formattedTimestamp}.${type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: `Exportação ${type.toUpperCase()} Iniciada`});
  }, [clients]);

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <PageHeader 
        title="Clientes & Projetos (DEV)" 
        description="Gerencie seus clientes, projetos, prazos e anotações." 
        icon={<Users2 />} 
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4"/>Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('json')}><FileJson className="mr-2 h-4 w-4"/>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}><FileCsv className="mr-2 h-4 w-4"/>CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => handleOpenForm(null)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4"/>Adicionar
            </Button>
          </div>
        }
      />
      <div className="space-y-6">
        <Card>
          <CardHeader className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><Filter className="h-4 w-4 mr-2"/>Status: {statusFilter === 'all' ? 'Todos' : statusConfig[statusFilter as ClientStatus].label}</SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(statusConfig).map(([k, {label}]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger><Filter className="h-4 w-4 mr-2"/>Prioridade: {priorityFilter === 'all' ? 'Todas' : priorityConfig[priorityFilter as ClientPriority].label}</SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{Object.entries(priorityConfig).map(([k, {label}]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>
        {clients.length > 0 && <Card><CardHeader><CardTitle className="font-headline text-lg">Resumo</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-x-4 gap-y-2 text-sm"><div className="flex items-center gap-2 font-medium">Total: <span className="text-xl font-bold">{clientSummary.total || 0}</span></div>{Object.entries(clientSummary).filter(([k]) => k !== 'total').map(([s, c]) => (<div key={s} className="flex items-center gap-2"><Circle className={cn("h-3 w-3 rounded-full", statusConfig[s as ClientStatus].iconColor)}/>{statusConfig[s as ClientStatus].label}: <span className="font-bold">{c}</span></div>))}</CardContent></Card>}
        
        {filteredClients.length === 0 ? <Card className="text-center py-12 border-dashed"><CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50"/><CardTitle className="mt-4">Nenhum resultado</CardTitle><CardDescription>Tente ajustar seus filtros ou adicione um cliente.</CardDescription></CardHeader><CardContent><Button onClick={() => handleOpenForm(null)}>Adicionar Cliente</Button></CardContent></Card> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredClients.map(c => <Card key={c.id} className="min-h-[260px] flex flex-col justify-between shadow-md transition hover:shadow-xl hover:border-primary/30 border border-transparent"><CardHeader><div className="flex justify-between items-start"><CardTitle className="font-headline text-lg">{c.name}</CardTitle><Badge variant="outline" className={cn(statusConfig[c.status].color, "ws-nowrap")}><Circle className={cn("mr-2 h-2 w-2 rounded-full", statusConfig[c.status].iconColor)}/>{statusConfig[c.status].label}</Badge></div><CardDescription>{c.serviceType}</CardDescription></CardHeader><CardContent className="space-y-2 text-sm flex-grow"><p><strong>Prioridade:</strong> <span className={priorityConfig[c.priority].color}>{priorityConfig[c.priority].label}</span></p><p><strong>Início:</strong> {format(parseISO(c.startDate), "dd/MM/yy")}</p><p><strong>Entrega:</strong> {format(parseISO(c.deadline), "dd/MM/yy")}</p></CardContent><div className="border-t pt-2 mt-2"><CardFooter className="flex justify-end gap-2 p-2"><Button variant="ghost" size="sm" onClick={() => handleOpenForm(c)}><Edit className="mr-2 h-4 w-4"/>Editar</Button><Button variant="destructive-outline" size="sm" onClick={() => setClientToDelete(c)}><Trash2 className="mr-2 h-4 w-4"/>Excluir</Button></CardFooter></div></Card>)}</div>}
      </div>

      <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90vh]">
        <DialogHeader>
            <DialogTitle className="font-headline">{editingClient ? "Editar" : "Adicionar"} Cliente/Projeto</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
            <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Nome Cliente/Projeto</Label>
                            <Input id="name" {...register("name")} autoFocus />
                            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="serviceType">Serviço</Label>
                            <Input id="serviceType" {...register("serviceType")} />
                            {errors.serviceType && <p className="text-sm text-destructive mt-1">{errors.serviceType.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Data de Início</Label>
                            <Input id="startDate" type="date" {...register("startDate")} />
                            {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="deadline">Data de Entrega</Label>
                            <Input id="deadline" type="date" {...register("deadline")} />
                            {errors.deadline && <p className="text-sm text-destructive mt-1">{errors.deadline.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Status</Label>
                            <Controller name="status" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{Object.entries(statusConfig).map(([k, {label}]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}</SelectContent>
                                </Select>
                            )}/>
                        </div>
                        <div>
                            <Label>Prioridade</Label>
                            <Controller name="priority" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{Object.entries(priorityConfig).map(([k, {label}]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}</SelectContent>
                                </Select>
                            )}/>
                        </div>
                    </div>
                    <div><Label htmlFor="tasks">Lista de Tarefas</Label><Textarea id="tasks" {...register("tasks")} rows={4}/></div>
                    <div><Label htmlFor="notes">Anotações</Label><Textarea id="notes" {...register("notes")} rows={4}/></div>
                </div>
                <div className="px-1"><ProjectPricingCalculator/></div>
            </form>
        </div>
        <DialogFooter className="sticky bottom-0 bg-background/90 backdrop-blur-sm pt-4 border-t -mx-6 px-6 pb-6">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" form="client-form">Salvar</Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={!!clientToDelete} onOpenChange={(o) => !o && setClientToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Excluir "{clientToDelete?.name}"? A ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({variant: "destructive"})}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Dialog>
  );
}
