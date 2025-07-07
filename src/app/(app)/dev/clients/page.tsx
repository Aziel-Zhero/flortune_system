// src/app/(app)/dev/clients/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2, PlusCircle, DollarSign, Calendar, BarChartHorizontalBig } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface Project {
  id: string;
  name: string;
  client: string;
  value: number;
  deadline: Date;
  status: 'planning' | 'in_progress' | 'delivered' | 'delayed' | 'on_hold';
}

const projectSchema = z.object({
  name: z.string().min(3, "Nome do projeto é obrigatório."),
  client: z.string().min(2, "Nome do cliente é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  deadline: z.date({ required_error: "Prazo é obrigatório." }),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const initialProjects: Project[] = [
    { id: 'proj1', name: 'Flortune V2 Features', client: 'Flortune Inc.', value: 15000, deadline: new Date('2024-08-30'), status: 'in_progress' },
    { id: 'proj2', name: 'E-commerce de Roupas', client: 'Moda & Estilo', value: 25000, deadline: new Date('2024-07-20'), status: 'delivered' },
    { id: 'proj3', name: 'API de Pagamentos', client: 'Fintech Solutions', value: 30000, deadline: new Date('2024-07-10'), status: 'delayed' },
    { id: 'proj4', name: 'Landing Page Institucional', client: 'Advocacia Silva', value: 5000, deadline: new Date('2024-09-15'), status: 'planning' },
];

const statusConfig = {
    planning: { label: 'Planejamento', color: 'bg-gray-400' },
    in_progress: { label: 'Em Execução', color: 'bg-blue-500' },
    delivered: { label: 'Entregue', color: 'bg-green-500' },
    delayed: { label: 'Atrasado', color: 'bg-red-500' },
    on_hold: { label: 'Em Espera', color: 'bg-yellow-500' },
};

export default function DevClientsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  useEffect(() => {
    document.title = `Clientes e Projetos (DEV) - ${APP_NAME}`;
  }, []);

  const { control, register, handleSubmit, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmitProject: SubmitHandler<ProjectFormData> = (data) => {
    const newProject: Project = {
      ...data,
      id: `proj_${Date.now()}`,
      status: 'planning',
    };
    setProjects(prev => [newProject, ...prev]);
    toast({ title: "Projeto Adicionado", description: `"${data.name}" para ${data.client} foi adicionado.` });
    reset();
  };

  const deliveryData = useMemo(() => {
    const counts = { delivered: 0, delayed: 0 };
    projects.forEach(p => {
        if (p.status === 'delivered') counts.delivered++;
        if (p.status === 'delayed') counts.delayed++;
    });
    return [
      { name: 'Entregas', 'No Prazo': counts.delivered, 'Atrasadas': counts.delayed }
    ];
  }, [projects]);


  return (
    <div>
      <PageHeader
        title="Gerenciamento de Clientes e Projetos (DEV)"
        description="Cadastre e acompanhe seus clientes, projetos, valores e prazos."
        icon={<Users2 className="h-6 w-6 text-primary" />}
      />

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Projeto</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmitProject)}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><Label htmlFor="name">Nome do Projeto</Label><Input id="name" {...register("name")} /></div>
            <div className="space-y-1.5"><Label htmlFor="client">Cliente</Label><Input id="client" {...register("client")} /></div>
            <div className="space-y-1.5"><Label htmlFor="value">Valor (R$)</Label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="value" type="number" {...register("value")} className="pl-10"/></div></div>
            <div className="space-y-1.5"><Label htmlFor="deadline">Prazo Final</Label><Controller name="deadline" control={control} render={({field}) => <Input type="date" onChange={e => field.onChange(e.target.valueAsDate)} />}/></div>
          </CardContent>
          <CardFooter>
            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Projeto</Button>
          </CardFooter>
        </form>
      </Card>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader><CardTitle className="font-headline">Projetos Ativos</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {projects.map(proj => (
                        <div key={proj.id} className="p-3 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex-1">
                                <p className="font-bold">{proj.name}</p>
                                <p className="text-sm text-muted-foreground">{proj.client}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="text-right">
                                    <p className="font-semibold">{proj.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                    <p className="text-xs text-muted-foreground">Prazo: {proj.deadline.toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="flex items-center gap-2 font-medium text-white text-xs px-2 py-1 rounded-full" style={{backgroundColor: statusConfig[proj.status].color}}>
                                    <div className="h-2 w-2 rounded-full bg-white"/>
                                    {statusConfig[proj.status].label}
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig/>Métricas de Entrega</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={deliveryData} layout="vertical" margin={{ left: 10 }}>
                             <XAxis type="number" hide />
                             <YAxis type="category" dataKey="name" hide />
                             <Tooltip cursor={{ fill: 'rgba(var(--muted)/0.5)' }} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
                             <Bar dataKey="No Prazo" stackId="a" fill="hsl(var(--primary))" radius={[4, 0, 0, 4]}>
                                <LabelList dataKey="No Prazo" position="center" fill="hsl(var(--primary-foreground))" fontSize={12} />
                             </Bar>
                             <Bar dataKey="Atrasadas" stackId="a" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]}>
                                 <LabelList dataKey="Atrasadas" position="center" fill="hsl(var(--destructive-foreground))" fontSize={12} />
                             </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
       </div>

    </div>
  );
}
