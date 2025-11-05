// src/app/(admin)/admin/marketing/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, TrendingUp, TrendingDown, Users, Star, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Pie, PieChart as PieChartRecharts, ResponsiveContainer, Cell, Sector, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

// --- MOCK DATA ---
const mockResponses = [
  { id: 1, questionId: 'q1', rating: 5, comment: 'Adorei a nova funcionalidade de metas!' },
  { id: 2, questionId: 'q1', rating: 4, comment: 'O app é bom, mas poderia ser mais rápido.' },
  { id: 3, questionId: 'q1', rating: 5, comment: 'Melhor app de finanças que já usei.' },
  { id: 4, questionId: 'q1', rating: 2, comment: 'Achei a interface confusa no começo.' },
  { id: 5, questionId: 'q1', rating: 3, comment: 'Funciona, mas não tem nada de especial.' },
  { id: 6, questionId: 'q1', rating: 5, comment: '' },
  { id: 7, questionId: 'q1', rating: 1, comment: 'Não consegui importar minhas transações.' },
  { id: 8, questionId: 'q1', rating: 4, comment: 'Gosto dos gráficos de análise.' },
  { id: 9, questionId: 'q1', rating: 5, comment: 'Super intuitivo e bonito.' },
  { id: 10, questionId: 'q1', rating: 4, comment: '' },
  { id: 11, questionId: 'q1', rating: 5, comment: 'Me ajudou a economizar de verdade.' },
  { id: 12, questionId: 'q1', rating: 2, comment: 'Faltam integrações com outros bancos.' },
];

const ActiveShape = (props: PieSectorDataItem) => {
  const RADIAN = Math.PI / 180;
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill, payload, percent = 0, value = 0 } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-3xl font-bold">
        {`${value}`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};


export default function MarketingDashboardPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    document.title = "Painel NPS - Flortune";
  }, []);

  const npsData = useMemo(() => {
    const promoters = mockResponses.filter(r => r.rating === 5).length;
    const passives = mockResponses.filter(r => r.rating === 4).length;
    const detractors = mockResponses.filter(r => r.rating <= 3).length;
    const total = mockResponses.length;
    
    if (total === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };

    const npsScore = Math.round(((promoters / total) - (detractors / total)) * 100);
    return { score: npsScore, promoters, passives, detractors, total };
  }, []);

  const responseDistribution = useMemo(() => {
    const distribution = Array(5).fill(0).map((_, i) => ({
        rating: i + 1,
        count: mockResponses.filter(r => r.rating === i + 1).length,
    }));
    return distribution;
  }, []);
  
  const npsGaugeColor = useMemo(() => {
    if (npsData.score >= 50) return "hsl(var(--chart-2))"; // Excelente (Verde)
    if (npsData.score >= 0) return "hsl(var(--chart-3))";   // Razoável (Amarelo)
    return "hsl(var(--destructive))"; // Ruim (Vermelho)
  }, [npsData.score]);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", stiffness: 100 } }),
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel de Net Promoter Score (NPS)"
        icon={<Heart />}
        description="Métricas de satisfação e lealdade do cliente baseadas no feedback recebido."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader><CardTitle className="font-headline text-lg">NPS Score</CardTitle><CardDescription>Promotores % - Detratores %</CardDescription></CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                  <ChartContainer config={{}} className="w-full h-[150px]">
                      <PieChartRecharts margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie
                            data={[{ value: npsData.score }, { value: 100 - Math.max(-100, npsData.score) }]}
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={70}
                            outerRadius={90}
                            cy="100%"
                            paddingAngle={2}
                            activeIndex={0}
                            activeShape={ActiveShape}
                            onMouseEnter={onPieEnter}
                           >
                              <Cell fill={npsGaugeColor} />
                              <Cell fill="hsl(var(--muted))" />
                          </Pie>
                      </PieChartRecharts>
                  </ChartContainer>
              </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Respostas</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{npsData.total}</div></CardContent></Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Promotores (Nota 5)</CardTitle><TrendingUp className="h-4 w-4 text-emerald-500"/></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{npsData.promoters}</div></CardContent></Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Detratores (Nota 1-3)</CardTitle><TrendingDown className="h-4 w-4 text-destructive"/></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{npsData.detractors}</div></CardContent></Card>
        </motion.div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Respostas</CardTitle>
              <CardDescription>Quantidade de respostas para cada nota da avaliação.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: "Respostas", color: "hsl(var(--chart-1))" } }} className="w-full h-72">
                  <BarChartRecharts data={responseDistribution} margin={{ left: -20 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="rating" label={{ value: "Nota", position: "insideBottom", offset: -5 }}/>
                      <YAxis dataKey="count" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={4}>
                         {responseDistribution.map((entry) => (
                           <Cell key={`cell-${entry.rating}`} fill={entry.rating === 5 ? "hsl(var(--chart-2))" : entry.rating === 4 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))"} />
                         ))}
                      </Bar>
                  </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare/> Respostas Recentes</CardTitle>
                    <CardDescription>Últimos comentários deixados pelos usuários.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-72 overflow-y-auto">
                    {mockResponses.filter(r => r.comment).map(response => (
                        <div key={response.id} className="p-2 border-l-4 rounded-r-md bg-muted/50" style={{ borderLeftColor: response.rating === 5 ? "hsl(var(--chart-2))" : response.rating === 4 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))" }}>
                            <p className="text-sm italic">"{response.comment}"</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Star className="h-3 w-3"/> Nota: {response.rating}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
      </div>

    </div>
  );
}
