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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, FileDown, Package, Clock, Settings, Edit, PlusCircle, CalendarIcon, KanbanSquare } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
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
  deadline: z.date({ required_error: "Data do prazo é obrigatória."}),
});
type ProjectFormData = z.infer<typeof projectSchema>;

const activitySchema = z.object({
  description: z.string().min(3, "Descrição é obrigatória."),
  dueDate: z.date().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

const assignActivitySchema = z.object({
  activityId: z.string().min(1, "Selecione uma atividade."),
  assignedTo: z.string().min(1, "Selecione um membro da equipe."),
  addToKanban: z.boolean().optional().default(false),
});
type AssignActivityFormData = z.infer<typeof assignActivitySchema>;


interface Activity {
  id: string;
  description: string;
  dueDate?: string | null;
  assignedTo?: string | null;
  status: 'available' | 'assigned';
  projectId?: string | null;
}

export default function TeamsPage() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLimitAlertOpen, setIsLimitAlertOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<(typeof teamMembers[0]) | null>(null);
  const [currentProject, setCurrentProject] = useState<(typeof projects[0]) | null>(null);

  const { register: memberRegister, handleSubmit: handleMemberSubmit, reset: resetMemberForm, formState: { errors: memberErrors } } = useForm<TeamMemberFormData>({ resolver: zodResolver(teamMemberSchema) });
  const { control: projectControl, handleSubmit: handleProjectSubmit, reset: resetProjectForm } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
  const { control: activityControl, handleSubmit: handleActivitySubmit, reset: resetActivityForm, formState: { errors: activityErrors } } = useForm<ActivityFormData>({ resolver: zodResolver(activitySchema) });
  const { control: assignControl, handleSubmit: handleAssignSubmit, reset: resetAssignForm, formState: { errors: assignErrors } } = useForm<AssignActivityFormData>({ resolver: zodResolver(assignActivitySchema) });
  
  const teamIsFull = useMemo(() => teamMembers.length >= 5, [teamMembers]);
  const availableActivities = useMemo(() => activities.filter(a => a.status === 'available'), [activities]);

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
    if(currentMember) {
      setTeamMembers(prev => prev.map(m => m.id === currentMember.id ? {...m, ...data} : m));
      toast({title: "Membro Atualizado!"});
    } else {
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
      const formattedData = { ...data, deadline: format(data.deadline, 'yyyy-MM-dd') };
      setProjects(prev => prev.map(p => p.id === currentProject.id ? {...p, ...formattedData } : p));
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
      resetProjectForm({ ...project, deadline: parseISO(project.deadline)});
      setIsEditProjectOpen(true);
  };
  
  const onActivitySubmit: SubmitHandler<ActivityFormData> = (data) => {
      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        description: data.description,
        dueDate: data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : null,
        status: 'available',
        projectId: null,
      }
      setActivities(prev => [newActivity, ...prev]);
      toast({ title: "Atividade Criada", description: `A atividade "${data.description}" está disponível para atribuição.`});
      setIsActivityModalOpen(false);
      resetActivityForm();
  };

  const onAssignSubmit: SubmitHandler<AssignActivityFormData> = (data) => {
      const assignedActivity = activities.find(a => a.id === data.activityId);
      if (!assignedActivity) return;
      
      setActivities(prev => prev.map(act => act.id === data.activityId ? {...act, status: 'assigned', assignedTo: data.assignedTo, projectId: currentProject?.id || null } : act));
      
      if (data.addToKanban) {
        try {
            const kanbanTasks = JSON.parse(localStorage.getItem('kanban-tasks') || '[]');
            const kanbanColumns = JSON.parse(localStorage.getItem('kanban-columns') || '[]');
            const todoColumn = kanbanColumns.find((c: any) => c.name.toLowerCase().includes('a fazer') || c.name.toLowerCase().includes('to do'));

            const newKanbanTask = {
                id: `task_${assignedActivity.id}`,
                columnId: todoColumn ? todoColumn.id : 'todo',
                title: assignedActivity.description,
                assignedTo: teamMembers.find(m => m.id === data.assignedTo)?.name || '',
                dueDate: assignedActivity.dueDate,
            };
            
            localStorage.setItem('kanban-tasks', JSON.stringify([...kanbanTasks, newKanbanTask]));
            toast({ title: "Atividade Atribuída e Adicionada ao Kanban!", description: `Atribuída a ${teamMembers.find(m => m.id === data.assignedTo)?.name}.`});

        } catch (e) {
            toast({ title: "Erro ao Sincronizar com Kanban", description: "Não foi possível adicionar a tarefa ao quadro.", variant: "destructive"});
        }
      } else {
        toast({title: "Atividade Atribuída!", description: `Atividade atribuída a ${teamMembers.find(m => m.id === data.assignedTo)?.name}.`});
      }

      setIsAssignModalOpen(false);
      resetAssignForm();
  }
  
  const handleOpenAssignDialog = (project: typeof projects[0] | null = null) => {
      setCurrentProject(project);
      resetAssignForm();
      setIsAssignModalOpen(true);
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <PageHeader title="Gestão de Equipes" description="Gerencie membros, acompanhe a performance e distribua o trabalho." icon={<Users className="h-6 w-6 text-primary" />}
          actions={
            <div className="flex gap-2">
              <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Relatório</Button>
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
                {teamMembers.length > 0 ? teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={member.avatar} data-ai-hint="user avatar" /><AvatarFallback>{member.name.split(' ').map((n:string)=>n[0]).join('')}</AvatarFallback></Avatar><div><p className="font-semibold">{member.name}</p><p className="text-xs text-muted-foreground">{member.role}</p></div></div></TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{member.activeProjects}</Badge></TableCell>
                    <TableCell><Progress value={member.taskProgress} className="h-2" /></TableCell>
                    <TableCell className="text-muted-foreground">{member.lastActivity}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenMemberDialog(member)}><Edit className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum membro na equipe.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <PageHeader title="Visão Geral de Projetos" description="Acompanhe a saúde e o andamento de todos os projetos ativos." icon={<Package className="h-6 w-6 text-primary" />} />
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map(p => {
                    const profit = p.value - p.cost;
                    const margin = p.value > 0 ? (profit / p.value) * 100 : 0;
                    return (
                        <Card key={p.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="font-headline">{p.name}</CardTitle>
                                    <div className="flex items-center -mr-2">
                                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAssignDialog(p)}><UserPlus className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Atribuir atividade a este projeto</p></TooltipContent></Tooltip>
                                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenProjectDialog(p)}><Settings className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Editar projeto</p></TooltipContent></Tooltip>
                                    </div>
                                </div>
                                <CardDescription>Cliente: {p.client}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/>Prazo:</span>
                                    <span>{format(parseISO(p.deadline), 'dd/MM/yyyy', { locale: ptBR })}</span>
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
                                    {p.team.map((memberId: string) => {
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
          ) : (
            <Card className="text-center py-12 border-dashed">
                <CardHeader><CardTitle>Nenhum projeto cadastrado.</CardTitle></CardHeader>
            </Card>
          )}
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
                <div><Label>Prazo Final</Label><Controller name="deadline" control={projectControl} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>)} /></div>
                <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar Alterações</Button></DialogFooter>
             </form>
          </DialogContent>
      </Dialog>

      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Nova Atividade</DialogTitle><DialogDescription>Crie uma nova tarefa que ficará disponível para atribuição.</DialogDescription></DialogHeader>
          <form onSubmit={handleActivitySubmit(onActivitySubmit)} className="space-y-4 py-2">
            <div>
                <Label htmlFor="activity-desc">Descrição da Atividade</Label>
                <Input id="activity-desc" {...activityControl.register("description")} />
                {activityErrors.description && <p className="text-sm text-destructive mt-1">{activityErrors.description.message}</p>}
            </div>
             <div>
              <Label>Prazo (Opcional)</Label>
              <Controller name="dueDate" control={activityControl} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, 'PPP', {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
                </Popover>
              )} />
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Criar Atividade</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

       <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir Atividade</DialogTitle><DialogDescription>Selecione uma atividade e um membro da equipe.</DialogDescription></DialogHeader>
          <form onSubmit={handleAssignSubmit(onAssignSubmit)} className="space-y-4 py-2">
             <div><Label>Atividade Disponível</Label><Controller name="activityId" control={assignControl} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione uma atividade..."/></SelectTrigger><SelectContent>{availableActivities.map(act => <SelectItem key={act.id} value={act.id}>{act.description}</SelectItem>)}</SelectContent></Select>)} />{assignErrors.activityId && <p className="text-sm text-destructive mt-1">{assignErrors.activityId.message}</p>}</div>
             <div><Label>Atribuir Para</Label><Controller name="assignedTo" control={assignControl} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione um membro..."/></SelectTrigger><SelectContent>{teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>)} />{assignErrors.assignedTo && <p className="text-sm text-destructive mt-1">{assignErrors.assignedTo.message}</p>}</div>
             <div className="flex items-center space-x-2">
                <Controller name="addToKanban" control={assignControl} render={({ field }) => (<Checkbox id="addToKanban" checked={field.value} onCheckedChange={field.onChange} />)} />
                <Label htmlFor="addToKanban" className="font-normal flex items-center gap-1.5"><KanbanSquare className="h-4 w-4"/>Adicionar ao Quadro Kanban</Label>
             </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Atribuir Atividade</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
