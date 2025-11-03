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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, FileDown, Briefcase, Package, Clock, Settings, Edit, PlusCircle, CalendarIcon } from "lucide-react";
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
import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

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

const activitySchema = z.object({
  description: z.string().min(3, "Descrição é obrigatória."),
  assignedTo: z.string().min(1, "Selecione um membro da equipe."),
  dueDate: z.date().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;


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

export default function TeamsPage() {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [projects, setProjects] = useState(initialProjects);

  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLimitAlertOpen, setIsLimitAlertOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<(typeof teamMembers[0]) | null>(null);
  const [currentProject, setCurrentProject] = useState<(typeof projects[0]) | null>(null);

  const { register: memberRegister, handleSubmit: handleMemberSubmit, reset: resetMemberForm, formState: { errors: memberErrors } } = useForm<TeamMemberFormData>({ resolver: zodResolver(teamMemberSchema) });
  const { control: projectControl, handleSubmit: handleProjectSubmit, reset: resetProjectForm } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
  const { control: activityControl, handleSubmit: handleActivitySubmit, reset: resetActivityForm, formState: { errors: activityErrors } } = useForm<ActivityFormData>({ resolver: zodResolver(activitySchema) });

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
    if (!member && teamIsFull) {
      setIsLimitAlertOpen(true);
    } else {
      setCurrentMember(member);
      if(member) {
          resetMemberForm(member);
          setIsEditMemberOpen(true);
      } else {
          resetMemberForm({name: "", email: "", role: ""});
          setIsAddMemberDialogOpen(true);
      }
    }
  };
  
  const handleOpenProjectDialog = (project: typeof projects[0]) => {
      setCurrentProject(project);
      resetProjectForm(project);
      setIsEditProjectOpen(true);
  };
  
  const onActivitySubmit: SubmitHandler<ActivityFormData> = (data) => {
      toast({
          title: "Atividade Criada (Simulação)",
          description: `Atividade "${data.description}" atribuída a ${teamMembers.find(m => m.id === data.assignedTo)?.name}.`
      });
      setIsActivityModalOpen(false);
      resetActivityForm();
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <PageHeader title="Gestão de Equipes" description="Gerencie membros da equipe, acompanhe a performance e atribua projetos." icon={<Users className="h-6 w-6 text-primary" />}
          actions={
            <div className="flex gap-2">
              <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Gerar Relatório</Button>
              <Button onClick={() => setIsActivityModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Criar Atividade</Button>
              <Button onClick={() => handleOpenMemberDialog(null)}><UserPlus className="mr-2 h-4 w-4"/>Adicionar Membro</Button>
            </div>
          }
        />
        
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
                              <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/>Prazo:</span>
                                  <span>{new Date(p.deadline + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Rentabilidade:</span>
                                  <span className={margin < 30 ? 'text-destructive font-semibold' : 'text-emerald-500 font-semibold'}>{margin.toFixed(1)}%</span>
                              </div>
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
                <div><Label htmlFor="project-value">Valor do Contrato (R$)</Label><Input id="project-value" type="number" step="0.01" {...projectControl.register("value")} /></div>
                <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar Alterações</Button></DialogFooter>
             </form>
          </DialogContent>
      </Dialog>

      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Nova Atividade</DialogTitle><DialogDescription>Atribua uma nova tarefa para um membro da equipe.</DialogDescription></DialogHeader>
          <form onSubmit={handleActivitySubmit(onActivitySubmit)} className="space-y-4 py-2">
            <div>
                <Label htmlFor="activity-desc">Descrição da Atividade</Label>
                <Input id="activity-desc" {...activityControl.register("description")} />
                {activityErrors.description && <p className="text-sm text-destructive mt-1">{activityErrors.description.message}</p>}
            </div>
            <div>
              <Label>Atribuir Para</Label>
              <Controller name="assignedTo" control={activityControl} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione um membro..."/></SelectTrigger><SelectContent>{teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
              )} />
               {activityErrors.assignedTo && <p className="text-sm text-destructive mt-1">{activityErrors.assignedTo.message}</p>}
            </div>
             <div>
              <Label>Prazo (Opcional)</Label>
              <Controller name="dueDate" control={activityControl} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                </Popover>
              )} />
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Criar Atividade</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
