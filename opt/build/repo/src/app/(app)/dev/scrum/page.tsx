// src/app/(app)/dev/scrum/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
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
import { ListChecks, GanttChartSquare, BarChart, History, Users, PlusCircle, UserPlus, Crown, Shield, Code } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import anime from 'animejs';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

interface ScrumFeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

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

const roleIcons: Record<ScrumRole, React.ElementType> = {
    "Product Owner": Crown,
    "Scrum Master": Shield,
    "Developer": Code
}

const ScrumFeatureCard: React.FC<ScrumFeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <Card className="scrum-card opacity-0 shadow-lg hover:shadow-primary/20 transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="p-3 bg-primary/10 rounded-full">
           <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-headline text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default function DevScrumPage() {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<NewMemberFormData>({
    resolver: zodResolver(newMemberSchema),
  });

  useEffect(() => {
    document.title = `Scrum Planner (DEV) - ${APP_NAME}`;
    if (pageContainerRef.current) {
      anime({
        targets: '.scrum-card, .sprint-card, .team-card',
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 800,
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeOutExpo'
      });
    }
  }, []);

  const onAddMember = (data: NewMemberFormData) => {
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

  const scrumFeatures: ScrumFeatureCardProps[] = [
    { title: "Gerenciar Sprints", description: "Crie, planeje e execute sprints com seu time.", icon: GanttChartSquare },
    { title: "Burndown Chart", description: "Visualize o progresso da sprint em tempo real.", icon: BarChart },
    { title: "Gestão de Backlog", description: "Priorize e gerencie as histórias de usuário.", icon: ListChecks },
    { title: "Histórico e Retrospectivas", description: "Acesse sprints passadas e registre aprendizados.", icon: History },
  ];

  return (
    <div ref={pageContainerRef}>
      <PageHeader
        title="Scrum Planner (DEV)"
        description="Ferramentas para planejar e executar projetos usando a metodologia Scrum."
        icon={<ListChecks className="h-6 w-6 text-primary" />}
        actions={<Button><PlusCircle className="mr-2"/>Nova Sprint</Button>}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-md sprint-card opacity-0">
                <CardHeader>
                <CardTitle className="font-headline text-xl">Sprint Atual: "Lançamento V1"</CardTitle>
                <CardDescription>2 de Julho, 2024 - 16 de Julho, 2024 (10 dias restantes)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-muted-foreground">Progresso da Sprint (Story Points)</span>
                            <span className="font-semibold">65%</span>
                        </div>
                        <Progress value={65} className="h-3" />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <div className="flex -space-x-2">
                            {teamMembers.map(member => (
                               <Avatar key={member.id} className="h-8 w-8 border-2 border-card">
                                   <AvatarImage src={member.avatarUrl} data-ai-hint="user avatar" />
                                   <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                               </Avatar> 
                            ))}
                        </div>
                        <div>
                        <span className="text-sm"><strong>8</strong> Tarefas Concluídas</span>
                        <span className="text-sm text-muted-foreground"> / 12</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scrumFeatures.map(feature => (
                    <ScrumFeatureCard key={feature.title} {...feature} />
                ))}
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
             <Card className="team-card opacity-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><Users className="mr-2"/>Time da Sprint</CardTitle>
                    <CardDescription>Membros responsáveis pela entrega da sprint atual.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {teamMembers.map(member => {
                        const RoleIcon = roleIcons[member.role];
                        return (
                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.avatarUrl} data-ai-hint="user avatar" />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><RoleIcon className="h-3 w-3"/>{member.role}</p>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
                <CardFooter>
                     <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <UserPlus className="mr-2 h-4 w-4"/>Adicionar Membro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-headline">Adicionar Membro ao Time</DialogTitle>
                                <DialogDescription>
                                    Insira os detalhes do novo membro para esta sprint.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onAddMember)} className="space-y-4 py-2">
                                <div>
                                    <Label htmlFor="memberName">Nome</Label>
                                    <Input id="memberName" {...register("name")} />
                                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="memberRole">Papel</Label>
                                    <Controller
                                        name="role"
                                        control={control}
                                        render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="memberRole"><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Product Owner">Product Owner</SelectItem>
                                                <SelectItem value="Scrum Master">Scrum Master</SelectItem>
                                                <SelectItem value="Developer">Developer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        )}
                                    />
                                    {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
                                </div>
                                 <div>
                                    <Label htmlFor="memberAvatar">URL do Avatar (Opcional)</Label>
                                    <Input id="memberAvatar" {...register("avatarUrl")} placeholder="https://..." />
                                     {errors.avatarUrl && <p className="text-sm text-destructive mt-1">{errors.avatarUrl.message}</p>}
                                </div>
                                <DialogFooter className="pt-2">
                                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                    <Button type="submit">Adicionar ao Time</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
             </Card>
        </div>
      </div>
    </div>
  );
}
