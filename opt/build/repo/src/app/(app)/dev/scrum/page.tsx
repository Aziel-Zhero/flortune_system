// src/app/(app)/dev/scrum/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { GanttChartSquare, PlusCircle, UserPlus, Crown, Shield, Code, ArrowRight, ClipboardList, Flag, CheckCircle, BarChart, History } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type ScrumRole = "Product Owner" | "Scrum Master" | "Developer";

interface TeamMember {
  id: string;
  name: string;
  role: ScrumRole;
  avatarUrl?: string;
}

const initialTeam: TeamMember[] = [
    { id: 'u1', name: 'Alice', role: 'Product Owner', avatarUrl: 'https://placehold.co/40x40.png?text=A' },
    { id: 'u2', name: 'Bruno', role: 'Scrum Master', avatarUrl: 'https://placehold.co/40x40.png?text=B' },
    { id: 'u3', name: 'Carla', role: 'Developer', avatarUrl: 'https://placehold.co/40x40.png?text=C' },
];

const newMemberSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório."),
    role: z.enum(["Product Owner", "Scrum Master", "Developer"], { required_error: "Selecione um papel."}),
    avatarUrl: z.string().url("URL do avatar inválida.").optional().or(z.literal('')),
});
type NewMemberFormData = z.infer<typeof newMemberSchema>;

const newSprintSchema = z.object({
    name: z.string().min(5, "O nome da sprint é obrigatório."),
    goal: z.string().min(10, "O objetivo da sprint é obrigatório."),
});
type NewSprintFormData = z.infer<typeof newSprintSchema>;


const roleIcons: Record<ScrumRole, React.ElementType> = {
    "Product Owner": Crown,
    "Scrum Master": Shield,
    "Developer": Code
}

export default function DevScrumPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<NewMemberFormData>({
    resolver: zodResolver(newMemberSchema),
  });
  
  const { register: sprintRegister, handleSubmit: handleSprintSubmit, reset: resetSprintForm, formState: { errors: sprintErrors }} = useForm<NewSprintFormData>({
    resolver: zodResolver(newSprintSchema)
  });


  useEffect(() => {
    document.title = `Scrum Visual (DEV) - ${APP_NAME}`;
  }, []);

  const onAddMember: SubmitHandler<NewMemberFormData> = (data) => {
    const newMember: TeamMember = {
      id: `user_${Date.now()}`,
      name: data.name,
      role: data.role,
      avatarUrl: data.avatarUrl || `https://placehold.co/40x40.png?text=${data.name.charAt(0).toUpperCase()}`,
    };
    setTeamMembers(prev => [...prev, newMember]);
    reset({ name: "", role: undefined, avatarUrl: ""});
    setIsMemberModalOpen(false);
    toast({ title: "Membro Adicionado!", description: `${data.name} foi adicionado(a) ao time como ${data.role}.` });
  };
  
  const onNewSprintSubmit: SubmitHandler<NewSprintFormData> = (data) => {
    toast({ title: "Nova Sprint Criada!", description: `A sprint "${data.name}" foi iniciada.` });
    resetSprintForm({name: "", goal: ""});
    setIsSprintModalOpen(false);
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Visual Scrum (DEV)"
        description="Visualize e gerencie seu projeto Scrum em um fluxo de trabalho claro e conectado."
        icon={<GanttChartSquare className="h-6 w-6 text-primary" />}
        actions={
          <DialogTrigger asChild>
              <Button onClick={() => setIsSprintModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Nova Sprint</Button>
          </DialogTrigger>
        }
      />
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="w-full lg:w-1/4">
            <Card className="shadow-md h-full">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><ClipboardList/> Product Backlog</CardTitle>
                    <CardDescription>Priorize e refine as histórias de usuário aqui.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="p-2 bg-muted/50 rounded-md">1. Como usuário, quero fazer login...</p>
                  <p className="p-2 bg-muted/50 rounded-md">2. Como usuário, quero ver um dashboard...</p>
                  <Button variant="outline" size="sm" className="w-full mt-2">Ver Backlog Completo</Button>
                </CardContent>
            </Card>
        </motion.div>
        
        <ArrowRight className="h-8 w-8 text-muted-foreground self-center shrink-0 hidden lg:block" />

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="w-full lg:flex-1">
            <Card className="shadow-lg border-2 border-primary">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary flex items-center gap-2"><GanttChartSquare/> Sprint Atual: "Lançamento V1"</CardTitle>
                    <CardDescription>2 de Julho, 2024 - 16 de Julho, 2024 (10 dias restantes)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div><Label>Objetivo da Sprint:</Label><p className="text-sm">Entregar as funcionalidades básicas do dashboard para o primeiro release.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Velocity (Média): <span className="font-bold">25 SP</span></Label><div className="text-xs text-muted-foreground">Planejado: 30 SP / Realizado: 18 SP</div></div>
                        <div><Label>Definição de Pronto (DoD):</Label><ul className="list-disc list-inside text-xs text-muted-foreground"><li>Código Revisado</li><li>Testes Unitários OK</li><li>Deploy em Staging</li></ul></div>
                    </div>
                    <div><Label>Progresso (Story Points)</Label><Progress value={65} className="h-3 mt-1" /></div>
                    <div><Label>Impedimentos:</Label><p className="text-sm flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-md"><Flag className="h-4 w-4"/> API de pagamentos externa está indisponível.</p></div>
                </CardContent>
                <CardFooter><Button variant="secondary">Ver Quadro da Sprint</Button></CardFooter>
            </Card>
        </motion.div>
        
        <ArrowRight className="h-8 w-8 text-muted-foreground self-center shrink-0 hidden lg:block" />

          <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="w-full lg:w-1/4">
              <Card className="shadow-md h-full">
                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users2/> Time Scrum</CardTitle><CardDescription>Membros da Sprint.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                    {teamMembers.map(member => {
                        const RoleIcon = roleIcons[member.role];
                        return (
                            <div key={member.id} className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={member.avatarUrl} data-ai-hint="user avatar" /><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold text-sm">{member.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1.5"><RoleIcon className="h-3 w-3"/>{member.role}</p></div></div>
                        )
                    })}
                </CardContent>
                <CardFooter>
                      <DialogTrigger asChild><Button onClick={() => setIsMemberModalOpen(true)} variant="outline" className="w-full"><UserPlus className="mr-2 h-4 w-4"/>Gerenciar Time</Button></DialogTrigger>
                </CardFooter>
              </Card>
          </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible"><Card><CardHeader><CardTitle className="font-headline flex items-center gap-2"><CheckCircle/> Sprint Review</CardTitle><CardDescription>Revisão das entregas ao final da sprint.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Apresentar resultados ao PO e stakeholders.</p></CardContent></Card></motion.div>
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible"><Card><CardHeader><CardTitle className="font-headline flex items-center gap-2"><History/> Retrospectiva</CardTitle><CardDescription>O que foi bem, o que pode melhorar.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Registrar aprendizados para a próxima sprint.</p></CardContent></Card></motion.div>
          <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible"><Card><CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChart/> Relatórios</CardTitle><CardDescription>Métricas e performance do time.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Velocity, Burndown, tempo por tarefa, etc.</p></CardContent></Card></motion.div>
      </div>

      <Dialog open={isSprintModalOpen} onOpenChange={setIsSprintModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Planejar Nova Sprint</DialogTitle><DialogDescription>Defina o nome e o objetivo principal para a próxima sprint.</DialogDescription></DialogHeader>
            <form onSubmit={handleSprintSubmit(onNewSprintSubmit)} className="space-y-4">
                <div><Label htmlFor="sprint-name">Nome da Sprint</Label><Input id="sprint-name" {...sprintRegister("name")} placeholder='Ex: Lançamento V2 - Core' />{sprintErrors.name && <p className="text-sm text-destructive mt-1">{sprintErrors.name.message}</p>}</div>
                <div><Label htmlFor="sprint-goal">Objetivo da Sprint</Label><Input id="sprint-goal" {...sprintRegister("goal")} placeholder='Ex: Implementar autenticação e perfil do usuário' />{sprintErrors.goal && <p className="text-sm text-destructive mt-1">{sprintErrors.goal.message}</p>}</div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Iniciar Sprint</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-headline">Adicionar Membro ao Time</DialogTitle><DialogDescription>Insira os detalhes do novo membro para esta sprint.</DialogDescription></DialogHeader>
              <form onSubmit={handleSubmit(onAddMember)} className="space-y-4 py-2">
                  <div><Label htmlFor="memberName">Nome</Label><Input id="memberName" {...register("name")} />{errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}</div>
                  <div><Label htmlFor="memberRole">Papel</Label><Controller name="role" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="memberRole"><SelectValue placeholder="Selecione o papel" /></SelectTrigger><SelectContent><SelectItem value="Product Owner">Product Owner</SelectItem><SelectItem value="Scrum Master">Scrum Master</SelectItem><SelectItem value="Developer">Developer</SelectItem></SelectContent></Select>)}/>{errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}</div>
                  <div><Label htmlFor="memberAvatar">URL do Avatar (Opcional)</Label><Input id="memberAvatar" {...register("avatarUrl")} placeholder="https://..." />{errors.avatarUrl && <p className="text-sm text-destructive mt-1">{errors.avatarUrl.message}</p>}</div>
                  <DialogFooter className="pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Adicionar ao Time</Button></DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
