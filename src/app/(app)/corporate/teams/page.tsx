// src/app/(app)/corporate/teams/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
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
import { Users, UserPlus, FileDown, TrendingUp, Briefcase, ListChecks, BarChart, Package, Clock, AlertCircle, Settings, Edit } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart as AreaChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

const teamMemberSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  email: z.string().email("Email inválido."),
  role: z.string().min(2, "Papel é obrigatório."),
});
type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

const projectSchema = z.object({
  status: z.enum(['in_progress', 'delayed', 'completed', 'planning']),
  value: z.coerce.number().min(0, "O valor não pode ser negativo."),
});
type ProjectFormData = z.infer<typeof projectSchema>;

const initialTeamMembers = [
  { id: 'usr_1', name: 'Ana Silva', email: 'ana.silva@example.com', role: 'Gerente de Projetos', avatar: 'https://placehold.co/40x40/a2d2ff/333?text=AS', activeProjects: 3, lastActivity: '2 horas atrás', taskProgress: 85 },
  { id: 'usr_2', name: 'Bruno Costa', email: 'bruno.costa@example.com', role: 'Desenvolvedor Sênior', avatar: 'https://placehold.co/40x40/bde0fe/333?text=BC', activeProjects: 2, lastActivity: '30 minutos atrás', taskProgress: 95 },
  { id: 'usr_3', name: 'Carla Dias', email: 'carla.dias@example.com', role: 'Desenvolvedora Pleno', avatar: 'https://placehold.co/40x40/ffafcc/333?text=CD', activeProjects: 2, lastActivity: '5 horas atrás', taskProgress: 70 },
  { id: 'usr_4', name: 'Daniel Alves', email: 'daniel.alves@example.com', role: 'UX/UI Designer', avatar: 'https://placehold.co/40x40/caffbf/333?text=DA', activeProjects: 4, lastActivity: 'Ontem', taskProgress: 90 },
  { id: 'usr_5', name: 'Eduarda Lima', email: 'eduarda.lima@example.com', role: 'Estagiária', avatar: 'https://placehold.co/40x40/ffc8dd/333?text=EL', activeProjects: 1, lastActivity: 'Hoje', taskProgress: 60 },
];

const initialProjects = [
    { id: 'proj_1', name: 'Sistema de E-commerce', client: 'Loja Fashion', status: 'in_progress' as const, deadline: '2024-08-30', value: 50000, cost: 20000, team: ['usr_2', 'usr_3', 'usr_4'] },
    { id: 'proj_2', name: 'Aplicativo Mobile de Saúde', client: 'Clínica Bem-Estar', status: 'in_progress' as const, deadline: '2024-09-15', value: 80000, cost: 35000, team: ['usr_1', 'usr_2', 'usr_4'] },
    { id: 'proj_3', name: 'Manutenção de CRM Interno', client: 'Soluções Tech', status: 'delayed' as const, deadline: '2024-07-25', value: 15000, cost: 8000, team: ['usr_3'] },
    { id: 'proj_4', name: 'Website Institucional', client: 'Advocacia & Lei', status: 'completed' as const, deadline: '2024-07-10', value: 25000, cost: 10000, team: ['usr_4', 'usr_5'] },
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
  const [projects, setProjects] = useState(initialProjects);

  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLimitAlertOpen, setIsLimitAlertOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<(typeof teamMembers[0]) | null>(null);
  const [currentProject, setCurrentProject] = useState<(typeof projects[0]) | null>(null);

  const { register: memberRegister, handleSubmit: handleMemberSubmit, reset: resetMemberForm, formState: { errors: memberErrors } } = useForm<TeamMemberFormData>({ resolver: zodResolver(teamMemberSchema) });
  const { control: projectControl, handleSubmit: handleProjectSubmit, reset: resetProjectForm, formState: { errors: projectErrors } } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
  
  const teamIsFull = useMemo(() => teamMembers.length >= 5, [teamMembers]);

  useEffect(() => { document.title = `Gestão de Equipes - ${APP_NAME}`; }, []);
  
  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge variant="default" className="bg-blue-500">Em Andamento</Badge>;
      case 'delayed': return <Badge variant="destructive">Atrasado</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-600 text-white">Concluído</Badge>;
      default: return <Badge variant="outline">Planejamento</Badge>;
    }
  };

  const handleAddOrEditMember = (data: TeamMemberFormData) => {
    if(currentMember) { // Editing
      setTeamMembers(prev => prev.map(m => m.id === currentMember.id ? {...m, ...data} : m));
      toast({title: "Membro Atualizado!"});
    } else { // Adding
      const newMember = { id: `usr_${Date.now()}`, ...data, avatar: `https://placehold.co/40x40/cdb4db/333?text=${data.name.charAt(0).toUpperCase()}`, activeProjects: 0, lastActivity: 'Agora', taskProgress: 0 };
      setTeamMembers(prev => [...prev, newMember]);
      toast({ title: "Membro Adicionado!", description: `${data.name} foi adicionado(a) à equipe.`});
    }
    setIsAddMemberDialogOpen(false);
    setIsEditMemberOpen(false);
    setCurrentMember(null);
  }

  const handleEditProject = (data: ProjectFormData) => {
      if(!currentProject) return;
      setProjects(prev => prev.map(p => p.id === currentProject.id ? {...p, ...data} : p));
      toast({title: "Projeto Atualizado!"});
      setIsEditProjectOpen(false);
      setCurrentProject(null);
  };
  
  const handleOpenMemberDialog = (member: (typeof teamMembers[0]) | null) => {
      setCurrentMember(member);
      if(member) {
          resetMemberForm(member);
          setIsEditMemberOpen(true);
      } else {
          resetMemberForm({name: "", email: "", role: ""});
          setIsAddMemberDialogOpen(true);
      }
  };
  
  const handleOpenProjectDialog = (project: typeof projects[0]) => {
      setCurrentProject(project);
      resetProjectForm(project);
      setIsEditProjectOpen(true);
  };

  const AddMemberButton = () => (
    <Button onClick={() => teamIsFull ? setIsLimitAlertOpen(true) : handleOpenMemberDialog(null)}>
      <UserPlus className="mr-2 h-4 w-4"/>Adicionar Membro
    </Button>
  );

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <PageHeader title="Gestão de Equipes" description="Gerencie membros da equipe, acompanhe a performance e atribua projetos." icon={<Users className="h-6 w-6 text-primary" />}
          actions={
            <div className="flex gap-2">
              <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Gerar Relatório</Button>
              <AddMemberButton />
            </div>
          }
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card><CardHeader><CardTitle className="font-headline text-lg">Membros Ativos</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><Users className="h-8 w-8 text-primary"/><p className="text-3xl font-bold">{teamMembers.length} / 5</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-headline text-lg">Projetos em Andamento</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><Briefcase className="h-8 w-8 text-blue-500"/><p className="text-3xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-headline text-lg">Tarefas Concluídas</CardTitle><CardDescription className="text-xs">Este mês</CardDescription></CardHeader><CardContent className="flex items-center gap-4"><ListChecks className="h-8 w-8 text-green-500"/><p className="text-3xl font-bold">128</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-headline text-lg">Faturamento da Equipe</CardTitle><CardDescription className="text-xs">Este mês</CardDescription></CardHeader><CardContent className="flex items-center gap-4"><TrendingUp className="h-8 w-8 text-emerald-500"/><p className="text-3xl font-bold"><PrivateValue value={'R$ 95.000'}/></p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-headline">Membros da Equipe</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Projetos Ativos</TableHead><TableHead>Progresso de Tarefas</TableHead><TableHead>Última Atividade</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={member.avatar} data-ai-hint="user avatar" /><AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar><div><p className="font-semibold">{member.name}</p><p className="text-xs text-muted-foreground">{member.role}</p></div></div></TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{member.activeProjects}</Badge></TableCell>
                    <TableCell><Progress value={member.taskProgress} className="h-2" /></TableCell>
                    <TableCell className="text-muted-foreground">{member.lastActivity}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenMemberDialog(member)}><Edit className="h-4 w-4" /></Button></TableCell>
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
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProjectDialog(p)}><Settings className="h-4 w-4"/></Button>
                              </div>
                              <CardDescription>Cliente: {p.client}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/>Prazo:</span><span>{format(new Date(p.deadline), 'dd/MM/yyyy')}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rentabilidade:</span><span className={margin < 30 ? 'text-destructive font-semibold' : 'text-emerald-500 font-semibold'}>{margin.toFixed(1)}%</span></div>
                               {getProjectStatusBadge(p.status)}
                          </CardContent>
                           <CardFooter className="pt-2 border-t">
                             <div className="flex items-center justify-between w-full">
                                  <span className="text-sm text-muted-foreground">Equipe:</span>
                                  <div className="flex -space-x-2">
                                  {p.team.map(memberId => {
                                      const member = teamMembers.find(m => m.id === memberId);
                                      if (!member) return null;
                                      return (
                                          <Tooltip key={member.id}><TooltipTrigger asChild><Avatar className="h-7 w-7 border-2 border-card"><AvatarImage src={member.avatar} data-ai-hint="user avatar"/><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{member.name}</p></TooltipContent></Tooltip>
                                      )
                                  })}
                                  </div>
                              </div>
                          </CardFooter>
                      </Card>
                  )
              })}
          </div>
        </div>
        
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>Performance da Equipe (Tarefas Concluídas)</CardTitle><CardDescription>Visualização da produtividade e valor gerado pela equipe ao longo do tempo.</CardDescription></CardHeader>
          <CardContent><ChartContainer config={{tasks: {label: "Tarefas"}, value: {label: "Valor (R$)"}}} className="w-full h-80"><AreaChartRecharts accessibilityLayer data={teamPerformanceData}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} /><YAxis yAxisId="left" tickFormatter={(value) => `${value}`} /><YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `R$${(value / 1000)}k`} /><RechartsTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => (name === "tasks" ? `${value} tarefas` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number))} indicator="dot" />} /><ChartLegend content={<ChartLegendContent />} /><defs><linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} /></linearGradient><linearGradient id="fillTasks" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} /></linearGradient></defs><Area yAxisId="right" dataKey="value" type="natural" fill="url(#fillValue)" stroke="hsl(var(--chart-2))" stackId="a" name="Valor Gerado"/><Area yAxisId="left" dataKey="tasks" type="natural" fill="url(#fillTasks)" stroke="hsl(var(--chart-1))" stackId="b" name="Tarefas Concluídas"/></AreaChartRecharts></ChartContainer></CardContent>
        </Card>
      </div>

      <AlertDialog open={isLimitAlertOpen} onOpenChange={setIsLimitAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Limite de Usuários Atingido</AlertDialogTitle><AlertDialogDescription>Seu plano Corporativo inclui 5 usuários. Para adicionar mais membros, você pode adquirir licenças adicionais por um valor especial de R$ 80,00 por usuário/mês.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => toast({title: "Contato com Vendas (Simulação)", description: "Você seria redirecionado para falar com nossa equipe de vendas."})}>Falar com Vendas</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddMemberDialogOpen || isEditMemberOpen} onOpenChange={(open) => {if (!open) {setIsAddMemberDialogOpen(false); setIsEditMemberOpen(false); setCurrentMember(null)}}}>
          <DialogContent>
            <DialogHeader><DialogTitle>{currentMember ? "Editar Membro" : "Adicionar Novo Membro"}</DialogTitle></DialogHeader>
            <form onSubmit={handleMemberSubmit(handleAddOrEditMember)} className="space-y-4 py-2">
                <div><Label htmlFor="member-name">Nome</Label><Input id="member-name" {...memberRegister("name")} />{memberErrors.name && <p className="text-sm text-destructive mt-1">{memberErrors.name.message}</p>}</div>
                <div><Label htmlFor="member-email">Email</Label><Input id="member-email" type="email" {...memberRegister("email")} />{memberErrors.email && <p className="text-sm text-destructive mt-1">{memberErrors.email.message}</p>}</div>
                <div><Label htmlFor="member-role">Papel</Label><Input id="member-role" {...memberRegister("role")} />{memberErrors.role && <p className="text-sm text-destructive mt-1">{memberErrors.role.message}</p>}</div>
                <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>Editar Projeto: {currentProject?.name}</DialogTitle></DialogHeader>
             <form onSubmit={handleProjectSubmit(handleEditProject)} className="space-y-4 py-2">
                <div><Label>Status</Label><Controller name="status" control={projectControl} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="planning">Planejamento</SelectItem><SelectItem value="in_progress">Em Andamento</SelectItem><SelectItem value="delayed">Atrasado</SelectItem><SelectItem value="completed">Concluído</SelectItem></SelectContent></Select>)}/></div>
                <div><Label htmlFor="project-value">Valor do Contrato (R$)</Label><Input id="project-value" type="number" step="0.01" {...projectControl.register("value")} />{projectErrors.value && <p className="text-sm text-destructive mt-1">{projectErrors.value.message}</p>}</div>
                <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar Alterações</Button></DialogFooter>
             </form>
          </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
