// src/app/(app)/corporate/teams/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, FileDown, TrendingUp, Briefcase, ListChecks, BarChart, Package, Clock, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart as AreaChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

const initialTeamMembers = [
  { id: 'usr_1', name: 'Ana Silva', role: 'Gerente de Projetos', avatar: 'https://placehold.co/40x40/a2d2ff/333?text=AS', activeProjects: 3, lastActivity: '2 horas atrás', taskProgress: 85 },
  { id: 'usr_2', name: 'Bruno Costa', role: 'Desenvolvedor Sênior', avatar: 'https://placehold.co/40x40/bde0fe/333?text=BC', activeProjects: 2, lastActivity: '30 minutos atrás', taskProgress: 95 },
  { id: 'usr_3', name: 'Carla Dias', role: 'Desenvolvedora Pleno', avatar: 'https://placehold.co/40x40/ffafcc/333?text=CD', activeProjects: 2, lastActivity: '5 horas atrás', taskProgress: 70 },
  { id: 'usr_4', name: 'Daniel Alves', role: 'UX/UI Designer', avatar: 'https://placehold.co/40x40/caffbf/333?text=DA', activeProjects: 4, lastActivity: 'Ontem', taskProgress: 90 },
  { id: 'usr_5', name: 'Eduarda Lima', role: 'Estagiária', avatar: 'https://placehold.co/40x40/ffc8dd/333?text=EL', activeProjects: 1, lastActivity: 'Hoje', taskProgress: 60 },
];

const projects = [
    { id: 'proj_1', name: 'Sistema de E-commerce', client: 'Loja Fashion', status: 'in_progress', deadline: '2024-08-30', value: 50000, cost: 20000, team: ['usr_2', 'usr_3', 'usr_4'] },
    { id: 'proj_2', name: 'Aplicativo Mobile de Saúde', client: 'Clínica Bem-Estar', status: 'in_progress', deadline: '2024-09-15', value: 80000, cost: 35000, team: ['usr_1', 'usr_2', 'usr_4'] },
    { id: 'proj_3', name: 'Manutenção de CRM Interno', client: 'Soluções Tech', status: 'delayed', deadline: '2024-07-25', value: 15000, cost: 8000, team: ['usr_3'] },
    { id: 'proj_4', name: 'Website Institucional', client: 'Advocacia & Lei', status: 'completed', deadline: '2024-07-10', value: 25000, cost: 10000, team: ['usr_4', 'usr_5'] },
];

const teamPerformanceData = [
  { month: 'Jan', tasks: 45, value: 50000 },
  { month: 'Fev', tasks: 52, value: 65000 },
  { month: 'Mar', tasks: 60, value: 72000 },
  { month: 'Abr', tasks: 55, value: 68000 },
  { month: 'Mai', tasks: 65, value: 85000 },
  { month: 'Jun', tasks: 72, value: 95000 },
];

export default function TeamsPage() {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");

  const teamIsFull = teamMembers.length >= 5;

  useEffect(() => {
    document.title = `Gestão de Equipes - ${APP_NAME}`;
  }, []);
  
  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge variant="default" className="bg-blue-500">Em Andamento</Badge>;
      case 'delayed': return <Badge variant="destructive">Atrasado</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-600 text-white">Concluído</Badge>;
      default: return <Badge variant="outline">Planejamento</Badge>;
    }
  };
  
  const handleAddMember = () => {
    if (!newMemberName || !newMemberRole) {
        toast({ title: "Campos vazios", description: "Por favor, preencha nome e papel do novo membro.", variant: "destructive"});
        return;
    }
    const newMember = {
        id: `usr_${Date.now()}`,
        name: newMemberName,
        role: newMemberRole,
        avatar: `https://placehold.co/40x40/cdb4db/333?text=${newMemberName.charAt(0).toUpperCase()}`,
        activeProjects: 0,
        lastActivity: 'Agora',
        taskProgress: 0,
    };
    setTeamMembers(prev => [...prev, newMember]);
    toast({ title: "Membro Adicionado!", description: `${newMemberName} foi adicionado(a) à equipe.`});
    setNewMemberName("");
    setNewMemberRole("");
    setIsAddMemberDialogOpen(false);
  }

  const AddMemberButton = () => (
    <Button>
      <UserPlus className="mr-2 h-4 w-4"/>Adicionar Membro
    </Button>
  );

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <PageHeader
          title="Gestão de Equipes"
          description="Gerencie membros da equipe, acompanhe a performance e atribua projetos."
          icon={<Users className="h-6 w-6 text-primary" />}
          actions={
            <div className="flex gap-2">
              <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Gerar Relatório</Button>
              {teamIsFull ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <AddMemberButton />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limite de Usuários do Plano Atingido</AlertDialogTitle>
                      <AlertDialogDescription>
                        Seu plano Corporativo inclui 5 usuários. Para adicionar mais membros à sua equipe, você pode adquirir licenças adicionais por um valor especial de R$ 80,00 por usuário/mês.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toast({title: "Contato com Vendas (Simulação)", description: "Você seria redirecionado para falar com nossa equipe de vendas."})}>
                        Falar com Vendas
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                   <DialogTrigger asChild>
                     <AddMemberButton />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Novo Membro</DialogTitle><DialogDescription>Preencha as informações do novo membro da equipe.</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div><Label htmlFor="new-member-name">Nome</Label><Input id="new-member-name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} /></div>
                        <div><Label htmlFor="new-member-role">Papel</Label><Input id="new-member-role" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} /></div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleAddMember}>Adicionar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          }
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card><CardHeader><CardTitle className="font-headline text-lg">Membros Ativos</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><Users className="h-8 w-8 text-primary"/><p className="text-3xl font-bold">{teamMembers.length} / 5</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-headline text-lg">Projetos em Andamento</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><Briefcase className="h-8 w-8 text-blue-500"/><p className="text-3xl font-bold">8</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-headline text-lg">Tarefas Concluídas</CardTitle><CardDescription className="text-xs">Este mês</CardDescription></CardHeader><CardContent className="flex items-center gap-4"><ListChecks className="h-8 w-8 text-green-500"/><p className="text-3xl font-bold">128</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-headline text-lg">Faturamento da Equipe</CardTitle><CardDescription className="text-xs">Este mês</CardDescription></CardHeader><CardContent className="flex items-center gap-4"><TrendingUp className="h-8 w-8 text-emerald-500"/><p className="text-3xl font-bold"><PrivateValue value={'R$ 95.000'}/></p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-headline">Membros da Equipe</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Projetos Ativos</TableHead>
                  <TableHead>Progresso de Tarefas</TableHead>
                  <TableHead>Última Atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={member.avatar} data-ai-hint="user avatar" /><AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{member.activeProjects}</Badge></TableCell>
                    <TableCell><Progress value={member.taskProgress} className="h-2" /></TableCell>
                    <TableCell className="text-muted-foreground">{member.lastActivity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <PageHeader title="Visão Geral de Projetos" description="Acompanhe a saúde e o andamento de todos os projetos ativos." icon={<Package className="h-6 w-6 text-primary" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map(p => {
                  const profit = p.value - p.cost;
                  const margin = p.value > 0 ? (profit / p.value) * 100 : 0;
                  return (
                      <Card key={p.id}>
                          <CardHeader>
                              <div className="flex justify-between items-start">
                                  <CardTitle className="font-headline">{p.name}</CardTitle>
                                  {getProjectStatusBadge(p.status)}
                              </div>
                              <CardDescription>Cliente: {p.client}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/>Prazo:</span>
                                  <span>{new Date(p.deadline + 'T00:00:00Z').toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Rentabilidade:</span>
                                  <span className={margin < 30 ? 'text-destructive font-semibold' : 'text-emerald-500 font-semibold'}>{margin.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-sm text-muted-foreground">Equipe:</span>
                                  <div className="flex -space-x-2">
                                  {p.team.map(memberId => {
                                      const member = teamMembers.find(m => m.id === memberId);
                                      if (!member) return null;
                                      return (
                                          <Tooltip key={member.id}>
                                              <TooltipTrigger asChild>
                                                  <Avatar className="h-7 w-7 border-2 border-card"><AvatarImage src={member.avatar} data-ai-hint="user avatar"/><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                                              </TooltipTrigger>
                                              <TooltipContent><p>{member.name}</p></TooltipContent>
                                          </Tooltip>
                                      )
                                  })}
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  )
              })}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary"/>
              Performance da Equipe (Tarefas Concluídas)
            </CardTitle>
            <CardDescription>Visualização da produtividade e valor gerado pela equipe ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{tasks: {label: "Tarefas"}, value: {label: "Valor (R$)"}}} className="w-full h-80">
              <AreaChartRecharts accessibilityLayer data={teamPerformanceData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis yAxisId="left" tickFormatter={(value) => `${value}`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `R$${(value / 1000)}k`} />
                <RechartsTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent 
                      formatter={(value, name) => (name === "tasks" ? `${value} tarefas` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number))} 
                      indicator="dot" 
                  />} 
                />
                <ChartLegend content={<ChartLegendContent />} />
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} /></linearGradient>
                  <linearGradient id="fillTasks" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} /></linearGradient>
                </defs>
                <Area yAxisId="right" dataKey="value" type="natural" fill="url(#fillValue)" stroke="hsl(var(--chart-2))" stackId="a" name="Valor Gerado"/>
                <Area yAxisId="left" dataKey="tasks" type="natural" fill="url(#fillTasks)" stroke="hsl(var(--chart-1))" stackId="b" name="Tarefas Concluídas"/>
              </AreaChartRecharts>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
