
// src/app/(app)/dev/clients/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2, PlusCircle, Construction, ClipboardList, CalendarCheck2, Download } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

const clientSchema = z.object({
  clientNameOrProject: z.string().min(2, "Nome é obrigatório."),
  serviceType: z.string().optional(),
  status: z.enum(["planning", "in_progress", "delivered", "on_hold"]).default("planning"),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});
type ClientFormData = z.infer<typeof clientSchema>;

export default function DevClientsPage() {
  useEffect(() => {
    document.title = `Clientes (DEV) - ${APP_NAME}`;
  }, []);

  const { control, register, handleSubmit, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmitClient = (data: ClientFormData) => {
    console.log("Novo cliente/projeto:", data);
    toast({ title: "Cliente/Projeto Adicionado (Simulação)", description: `"${data.clientNameOrProject}" adicionado com sucesso (dados não persistidos).` });
    reset();
  };

  return (
    <div>
      <PageHeader
        title="Gerenciamento de Clientes e Projetos (DEV)"
        description="Cadastre e acompanhe seus clientes e projetos de desenvolvimento."
        icon={<Users2 className="h-6 w-6 text-primary" />}
      />

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Adicionar Novo Cliente/Projeto</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmitClient)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientNameOrProject">Nome Cliente/Projeto</Label>
                <Input id="clientNameOrProject" {...register("clientNameOrProject")} placeholder="Ex: Flortune App" />
              </div>
              <div>
                <Label htmlFor="serviceType">Tipo de Serviço</Label>
                <Input id="serviceType" {...register("serviceType")} placeholder="Ex: Desenvolvimento Web, Consultoria" />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status Atual</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="status"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="in_progress">Em Execução</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="on_hold">Em Espera</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Cliente/Projeto</Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="opacity-70">
            <CardHeader><CardTitle className="font-headline flex items-center"><ClipboardList className="mr-2"/>Anotações Rápidas</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Bloco de notas por cliente/projeto. (Em breve)</p></CardContent>
        </Card>
         <Card className="opacity-70">
            <CardHeader><CardTitle className="font-headline flex items-center"><CalendarCheck2 className="mr-2"/>Prazos e Entregas</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Controle de prazos e status visual de entregas. (Em breve)</p></CardContent>
        </Card>
         <Card className="opacity-70">
            <CardHeader><CardTitle className="font-headline flex items-center"><Download className="mr-2"/>Exportar Dados</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Exportar dados de clientes em JSON/CSV. (Em breve)</p></CardContent>
        </Card>
      </div>
      
      <Card className="mt-8 shadow-md bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center"><Construction className="mr-2"/>Funcionalidades em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">
            Esta seção de Clientes está em evolução. Funcionalidades como lista de tarefas por cliente,
            histórico detalhado e integrações serão adicionadas futuramente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
