// src/app/(app)/dev/web-management/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, PlusCircle, Trash2, Edit } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { PrivateValue } from "@/components/shared/private-value";

interface WebService {
  id: string;
  name: string;
  type: 'Dominio' | 'VPS' | 'Host' | 'SaaS' | 'Outro';
  provider: string;
  monthlyCost: number;
  renewalDate: string;
}

const serviceSchema = z.object({
  name: z.string().min(2, "O nome do serviço é obrigatório."),
  type: z.enum(['Dominio', 'VPS', 'Host', 'SaaS', 'Outro']),
  provider: z.string().min(2, "O nome do provedor é obrigatório."),
  monthlyCost: z.coerce.number().min(0, "O custo não pode ser negativo."),
  renewalDate: z.string().refine(v => v, { message: "Data de renovação é obrigatória." }),
});
type ServiceFormData = z.infer<typeof serviceSchema>;

export default function WebManagementPage() {
  const [services, setServices] = useState<WebService[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<WebService | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    document.title = `Gestão Web - ${APP_NAME}`;
    try {
      const storedServices = localStorage.getItem("flortune-web-services");
      if (storedServices) setServices(JSON.parse(storedServices));
    } catch (e) { console.error("Falha ao carregar serviços do localStorage", e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("flortune-web-services", JSON.stringify(services));
    } catch (e) { console.error("Falha ao salvar serviços no localStorage", e); }
  }, [services]);

  const totalMonthlyCost = services.reduce((acc, s) => acc + s.monthlyCost, 0);

  const handleOpenForm = (service: WebService | null = null) => {
    setEditingService(service);
    if (service) {
      reset(service);
    } else {
      reset({ name: "", type: 'SaaS', provider: "", monthlyCost: 0, renewalDate: "" });
    }
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<ServiceFormData> = (data) => {
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? { ...s, ...data } : s));
      toast({ title: "Serviço Atualizado!" });
    } else {
      setServices(prev => [{ ...data, id: `svc_${Date.now()}` }, ...prev]);
      toast({ title: "Serviço Adicionado!" });
    }
    setIsFormOpen(false);
    setEditingService(null);
  };
  
  const handleDelete = (serviceId: string) => {
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast({ title: "Serviço Removido", variant: "destructive"});
  }

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <div className="space-y-8">
        <PageHeader
          title="Gestão Web"
          description="Gerencie os custos de seus domínios, hospedagens, VPS e outras assinaturas."
          icon={<Globe className="h-6 w-6 text-primary" />}
          actions={<DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Serviço</Button></DialogTrigger>}
        />
        
        <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Custo Mensal Total</CardTitle><CardDescription>Soma de todos os seus custos recorrentes de infraestrutura web.</CardDescription></CardHeader>
            <CardContent><p className="text-3xl font-bold text-primary"><PrivateValue value={totalMonthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p></CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle className="font-headline">Serviços Contratados</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Provedor</TableHead><TableHead>Tipo</TableHead><TableHead>Custo Mensal</TableHead><TableHead>Renovação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {services.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum serviço adicionado.</TableCell></TableRow>}
                        {services.map(s => (
                            <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.provider}</TableCell><TableCell><Badge variant="outline">{s.type}</Badge></TableCell><TableCell><PrivateValue value={s.monthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></TableCell><TableCell>{s.renewalDate}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenForm(s)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label htmlFor="name">Nome do Serviço/Domínio</Label><Input id="name" {...register("name")} />{errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}</div>
          <div><Label htmlFor="provider">Provedor</Label><Input id="provider" {...register("provider")} />{errors.provider && <p className="text-sm text-destructive mt-1">{errors.provider.message}</p>}</div>
          <div><Label>Tipo</Label><Controller name="type" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Dominio">Domínio</SelectItem><SelectItem value="VPS">VPS</SelectItem><SelectItem value="Host">Hospedagem</SelectItem><SelectItem value="SaaS">SaaS</SelectItem><SelectItem value="Outro">Outro</SelectItem></SelectContent></Select>)}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="monthlyCost">Custo Mensal (R$)</Label><Input id="monthlyCost" type="number" {...register("monthlyCost")} />{errors.monthlyCost && <p className="text-sm text-destructive mt-1">{errors.monthlyCost.message}</p>}</div>
            <div><Label htmlFor="renewalDate">Data de Renovação</Label><Input id="renewalDate" type="date" {...register("renewalDate")} />{errors.renewalDate && <p className="text-sm text-destructive mt-1">{errors.renewalDate.message}</p>}</div>
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
