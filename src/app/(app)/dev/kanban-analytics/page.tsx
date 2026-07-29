"use client";

import { useEffect, useMemo, useState } from "react";
import { AreaChart, AlertTriangle, DollarSign, ListTodo, MoveRight, Puzzle, Workflow } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { APP_NAME } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PrivateValue } from "@/components/shared/private-value";

type Task = { id: string; columnId: string; value?: number; points?: number };
type Column = { id: string; name: string; wipLimit?: number };

export default function KanbanAnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = `Análise Kanban - ${APP_NAME}`;
    try {
      const savedTasks = localStorage.getItem("kanban-tasks");
      const savedColumns = localStorage.getItem("kanban-columns");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedColumns) setColumns(JSON.parse(savedColumns));
    } catch {
      setTasks([]);
      setColumns([]);
    } finally {
      setReady(true);
    }
  }, []);

  const distribution = useMemo(() => columns.map((column, index) => {
    const columnTasks = tasks.filter((task) => task.columnId === column.id);
    return {
      name: column.name,
      tasks: columnTasks.length,
      value: columnTasks.reduce((total, task) => total + (task.value || 0), 0),
      points: columnTasks.reduce((total, task) => total + (task.points || 0), 0),
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  }), [columns, tasks]);

  const metrics = useMemo(() => {
    const inProgress = columns.filter((column) => /andamento|doing|progresso/i.test(column.name)).map((column) => column.id);
    const done = columns.filter((column) => /concluíd|concluid|done|finaliz/i.test(column.name)).map((column) => column.id);
    const wip = tasks.filter((task) => inProgress.includes(task.columnId));
    return {
      wipCount: wip.length,
      wipValue: wip.reduce((total, task) => total + (task.value || 0), 0),
      wipPoints: wip.reduce((total, task) => total + (task.points || 0), 0),
      completed: tasks.filter((task) => done.includes(task.columnId)).length,
    };
  }, [columns, tasks]);

  const taskConfig = { tasks: { label: "Tarefas", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
  const valueConfig = { value: { label: "Valor", color: "hsl(var(--chart-2))" } } satisfies ChartConfig;

  if (!ready) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Análise Kanban" description="Métricas calculadas a partir das tarefas salvas no seu quadro." icon={<AreaChart className="h-6 w-6 text-primary" />} />
      {columns.length === 0 ? (
        <Card className="border-dashed text-center py-10 sm:py-12"><CardHeader><AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" /><CardTitle>Sem dados para analisar</CardTitle><CardDescription>Crie colunas e tarefas no quadro Kanban para visualizar os indicadores.</CardDescription></CardHeader></Card>
      ) : <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="Tarefas em andamento" value={metrics.wipCount} icon={<ListTodo className="text-primary" />} />
          <Metric title="Valor em andamento" value={<PrivateValue value={metrics.wipValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />} icon={<DollarSign className="text-emerald-500" />} />
          <Metric title="Pontos em andamento" value={metrics.wipPoints} icon={<Puzzle className="text-amber-500" />} />
          <Metric title="Tarefas concluídas" value={metrics.completed} icon={<MoveRight className="text-blue-500" />} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Distribuição de tarefas" description="Quantidade atual em cada coluna."><ChartContainer config={taskConfig} className="h-72 w-full"><BarChart data={distribution} margin={{ top: 16, left: -20, right: 8 }}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickFormatter={(value) => value.slice(0, 10)} interval={0} /><YAxis allowDecimals={false} width={32} /><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Bar dataKey="tasks" fill="var(--color-tasks)" radius={6}><LabelList dataKey="tasks" position="top" /></Bar></BarChart></ChartContainer></ChartCard>
          <ChartCard title="Distribuição de valor" description="Valor registrado nas tarefas por etapa."><ChartContainer config={valueConfig} className="h-72 w-full"><BarChart data={distribution} layout="vertical" margin={{ left: 8, right: 24 }}><CartesianGrid horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={88} tickFormatter={(value) => value.slice(0, 12)} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="value" fill="var(--color-value)" radius={6} /></BarChart></ChartContainer></ChartCard>
          <ChartCard title="Distribuição de esforço" description="Story points registrados por etapa."><ChartContainer config={{}} className="mx-auto h-72 w-full"><PieChart><Tooltip content={<ChartTooltipContent hideLabel />} /><Pie data={distribution} dataKey="points" nameKey="name" outerRadius={90}>{distribution.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie></PieChart></ChartContainer></ChartCard>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 font-headline"><Workflow /> Leitura do fluxo</CardTitle><CardDescription>O painel usa apenas o estado atual do quadro; não há histórico fictício.</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Para análises de tendência, registre tarefas e acompanhe a evolução do quadro ao longo do tempo.</CardContent></Card>
        </div>
      </>}
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: React.ReactNode; icon: React.ReactNode }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle>{icon}</CardHeader><CardContent><div className="text-2xl font-bold break-words">{value}</div></CardContent></Card>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="font-headline">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>;
}
