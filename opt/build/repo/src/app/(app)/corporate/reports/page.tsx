// src/app/(app)/corporate/reports/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, CheckCircle, GitCommit, PieChart as PieChartIcon, Users, Workflow, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Pie, PieChart as PieChartRecharts, Tooltip as RechartsTooltip, Cell, XAxis, YAxis, CartesianGrid } from "recharts";


const mockDailyProductivityData: any[] = [];
const mockTeamMembers: any[] = [];
const mockRecentActivities: any[] = [];

const performanceColors = {
    completed: "hsl(var(--chart-2))",
    in_progress: "hsl(var(--chart-3))",
    pending: "hsl(var(--muted))",
};


export default function CorporateReportsPage() {
  const [selectedMemberId, setSelectedMemberId] = useState('');

  useEffect(() => {
    document.title = `Relatórios Corporativos - ${APP_NAME}`;
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", stiffness: 100 } }),
  };
  
  const selectedMemberPerformance = useMemo(() => {
    const member = mockTeamMembers.find(m => m.id === selectedMemberId);
    if (!member) return [];
    return [
      { name: "Concluídas", value: member.performance.completed, fill: performanceColors.completed },
      { name: "Em Andamento", value: member.performance.in_progress, fill: performanceColors.in_progress },
      { name: "Pendentes", value: member.performance.pending, fill: performanceColors.pending },
    ];
  }, [selectedMemberId]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gráficos & Metas Corporativas"
        description="Visualize a produtividade diária e as atividades recentes da sua equipe."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader><CardTitle className="font-headline flex items-center gap-2">Produtividade Diária da Equipe</CardTitle><CardDescription>Acompanhe o número de tarefas concluídas a cada dia da semana.</CardDescription></CardHeader>
              <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
                  Nenhum dado de produtividade disponível.
              </CardContent>
            </Card>
          </motion.div>
          <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
              <Card>
                  <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                              <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon className="h-5 w-5"/>Performance Individual</CardTitle>
                              <CardDescription>Análise da distribuição de tarefas por membro.</CardDescription>
                          </div>
                          <Select value={selectedMemberId} onValueChange={setSelectedMemberId} disabled={mockTeamMembers.length === 0}>
                              <SelectTrigger className="w-full sm:w-[220px]">
                                  <SelectValue placeholder="Selecione um membro..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {mockTeamMembers.map(member => (
                                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
                      {selectedMemberPerformance.length > 0 ? (
                        <ChartContainer config={{}} className="w-full h-full">
                            <PieChartRecharts>
                                <RechartsTooltip cursor={true} content={<ChartTooltipContent />} />
                                <Pie
                                    data={selectedMemberPerformance}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {selectedMemberPerformance.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChartRecharts>
                        </ChartContainer>
                      ) : "Nenhum membro selecionado ou sem dados."}
                  </CardContent>
              </Card>
          </motion.div>
          <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5"/>Feed de Atividades da Equipe</CardTitle><CardDescription>O que sua equipe está trabalhando agora.</CardDescription></CardHeader>
                <CardContent className="space-y-4 max-h-80 overflow-y-auto">
                    {mockRecentActivities.length > 0 ? mockRecentActivities.map(act => {
                        const Icon = act.icon;
                        return (
                            <div key={act.id} className="flex items-start gap-3">
                                <Icon className="h-4 w-4 mt-1 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm"><span className="font-semibold">{act.user}</span> {act.action} <span className="font-semibold text-primary">"{act.subject}"</span>.</p>
                                    <p className="text-xs text-muted-foreground">{act.time}</p>
                                </div>
                            </div>
                        )
                    }) : <p className="text-sm text-center text-muted-foreground py-4">Nenhuma atividade recente.</p>}
                </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
