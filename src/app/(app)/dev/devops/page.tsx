// src/app/(app)/dev/devops/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { GitMerge, DollarSign, PlusCircle, AlertTriangle, BarChart, Trash2, Edit } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart as BarChartRecharts, Bar as BarRecharts, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";

// --- Tipos e Dados ---
interface System {
  id: string;
  name: string;
  client: string;
  contractValue: number;
  internalCost: number;
  renewalDate: string;
  status: 'active' | 'inactive';
}

const systemSchema = z.object({
  name: z.string().min(2, "O nome do sistema é obrigatório."),
  client: z.string().min(2, "O nome do cliente é obrigatório."),
  contractValue: z.coerce.number().min(0, "O valor do contrato não pode ser negativo."),
  internalCost: z.coerce.number().min(0, "O custo interno não pode ser negativo."),
  renewalDate: z.string().refine(v => v, { message: "Data de renovação é obrigatória." }),
  status: z.enum(['active', 'inactive']),
});
type SystemFormData = z.infer<typeof systemSchema>;

const mockProfitData = [
  { month: "Jan", profit: 2200 }, { month: "Fev", profit: 2500 },
  { month: "Mar", profit: 2300 }, { month: "Abr", profit: 2800 },
  { month: "Mai", profit: 3100 }, { month: "Jun", profit: 2900 },
];

export default function DevOpsPage() {
  const [systems, setSystems] = useState<System[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SystemFormData>({
    resolver: zodResolver(systemSchema),
  });

  useEffect(() => {
    document.title = `Gestão de Sistemas (DEV) - ${APP_NAME}`;
    // Carregar dados do localStorage
    try {
      const storedSystems = localStorage.getItem("flortune-devops-systems");
      if (storedSystems) setSystems(JSON.parse(storedSystems));
    } catch (e) { console.error("Falha ao carregar sistemas do localStorage", e); }
  }, []);

  useEffect(() => {
    // Salvar dados no localStorage
    try {
      localStorage.setItem("flortune-devops-systems", JSON.stringify(systems));
    } catch (e) { console.error("Falha ao salvar sistemas no localStorage", e); }
  }, [systems]);

  const summary = systems.reduce((acc, sys) => {
    if (sys.status === 'active') {
      acc.totalRevenue += sys.contractValue;
      acc.totalCost += sys.internalCost;
    }
    return acc;
  }, { totalRevenue: 0, totalCost: 0 });

  const totalProfit = summary.totalRevenue - summary.totalCost;

  const revenueByClient = systems.reduce((acc, sys) => {
    if(sys.status === 'active') {
        acc[sys.client] = (acc[sys.client] || 0) + sys.contractValue;
    }
    return acc;
  }, {} as Record<string, number>);

  const revenueChartData = Object.entries(revenueByClient).map(([name, revenue]) => ({ name, revenue }));

  const handleOpenForm = (system: System | null = null) => {
    setEditingSystem(system);
    if (system) {
      reset(system);
    } else {
      reset({ name: "", client: "", contractValue: 0, internalCost: 0, renewalDate: "", status: 'active' });
    }
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<SystemFormData> = (data) => {
    if (editingSystem) {
      setSystems(systems.map(s => s.id === editingSystem.id ? { ...s, ...data } : s));
      toast({ title: "Sistema Atualizado!", description: `"${data.name}" foi atualizado.` });
    } else {
      setSystems(prev => [{ ...data, id: `sys_${Date.now()}` }, ...prev]);
      toast({ title: "Sistema Adicionado!", description: `"${data.name}" foi adicionado.` });
    }
    setIsFormOpen(false);
    setEditingSystem(null);
  };
  
  const handleDelete = (systemId: string) => {
      setSystems(prev => prev.filter(s => s.id !== systemId));
      toast({ title: "Sistema Removido", variant: "destructive"});
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <PageHeader
        title="Gestão de Sistemas e Contratos (DEV)"
        description="Painel para gerenciar seus sistemas, clientes, custos e rentabilidade."
        icon={<GitMerge className="h-6 w-6 text-primary" />}
        actions={ <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Sistema</Button></DialogTrigger> }
      />
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card><CardHeader><CardTitle className="font-headline text-lg">Receita Mensal Total</CardTitle><CardDescription>Soma de todos os contratos ativos.</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold"><PrivateValue value={summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-headline text-lg">Custo Mensal Total</CardTitle><CardDescription>Soma de todos os custos internos.</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold"><PrivateValue value={summary.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-headline text-lg">Lucro Líquido Mensal</CardTitle><CardDescription>Receita Total - Custo Total.</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold text-primary"><PrivateValue value={totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p></CardContent></Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChart/> Lucro Líquido (Histórico Fictício)</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={mockProfitData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><RechartsTooltip formatter={(value) => `R$${value}`} /><Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-headline flex items-center gap-2"><DollarSign/> Receita por Cliente</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChartRecharts data={revenueChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} /><RechartsTooltip formatter={(value) => `R$${value}`} /><BarRecharts dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChartRecharts></ResponsiveContainer></CardContent></Card>
        </div>
        
        <Card>
            <CardHeader><CardTitle className="font-headline">Sistemas Gerenciados</CardTitle><CardDescription>Lista de todos os sistemas, seus custos, valores e margens.</CardDescription></CardHeader>
            <CardContent>
                {systems.length > 0 ? (
                    <Table><TableHeader><TableRow><TableHead>Sistema</TableHead><TableHead>Cliente</TableHead><TableHead>Valor Contrato</TableHead><TableHead>Custo Interno</TableHead><TableHead>Lucro Líquido</TableHead><TableHead>Margem</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {systems.map(sys => {
                                const profit = sys.contractValue - sys.internalCost;
                                const margin = sys.contractValue > 0 ? (profit / sys.contractValue) * 100 : 0;
                                return (
                                <TableRow key={sys.id} className={sys.status === 'inactive' ? 'opacity-50' : ''}><TableCell>{sys.name}</TableCell><TableCell>{sys.client}</TableCell><TableCell><PrivateValue value={sys.contractValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></TableCell><TableCell><PrivateValue value={sys.internalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></TableCell><TableCell className="font-semibold"><PrivateValue value={profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></TableCell><TableCell className={margin < 20 ? 'text-destructive' : 'text-emerald-600'}>{margin.toFixed(1)}%</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenForm(sys)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(sys.id)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (<div className="text-center py-8 text-muted-foreground"><AlertTriangle className="mx-auto h-10 w-10 mb-2" /><p>Nenhum sistema cadastrado. Adicione seu primeiro sistema para começar.</p></div>)}
            </CardContent>
        </Card>
      </div>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">{editingSystem ? "Editar Sistema" : "Novo Sistema"}</DialogTitle><DialogDescription>Preencha os detalhes do sistema ou contrato.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label htmlFor="name">Nome do Sistema/Projeto</Label><Input id="name" {...register("name")} />{errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}</div>
          <div><Label htmlFor="client">Cliente Associado</Label><Input id="client" {...register("client")} />{errors.client && <p className="text-sm text-destructive mt-1">{errors.client.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="contractValue">Valor do Contrato (R$)</Label><Input id="contractValue" type="number" {...register("contractValue")} />{errors.contractValue && <p className="text-sm text-destructive mt-1">{errors.contractValue.message}</p>}</div>
            <div><Label htmlFor="internalCost">Custo Interno (R$)</Label><Input id="internalCost" type="number" {...register("internalCost")} />{errors.internalCost && <p className="text-sm text-destructive mt-1">{errors.internalCost.message}</p>}</div>
          </div>
          <div><Label htmlFor="renewalDate">Data de Renovação</Label><Input id="renewalDate" type="date" {...register("renewalDate")} />{errors.renewalDate && <p className="text-sm text-destructive mt-1">{errors.renewalDate.message}</p>}</div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
