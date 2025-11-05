// src/app/(admin)/admin/leads/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Search, MoreHorizontal, Gift, User, Trash2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  lastActivity: string;
}

const mockLeads: Lead[] = [
  { id: 'lead_1', name: 'João da Silva', email: 'joao.silva@emailaleatorio.com', avatar: 'https://placehold.co/40x40/a2d2ff/333?text=JS', joinDate: '20/07/2024', lastActivity: '3 dias atrás' },
  { id: 'lead_2', name: 'Maria Oliveira', email: 'maria.oliveira@emailaleatorio.com', avatar: 'https://placehold.co/40x40/bde0fe/333?text=MO', joinDate: '15/07/2024', lastActivity: 'Hoje' },
  { id: 'lead_3', name: 'Pedro Santos', email: 'pedro.santos@emailaleatorio.com', avatar: 'https://placehold.co/40x40/ffafcc/333?text=PS', joinDate: '01/07/2024', lastActivity: '1 semana atrás' },
  { id: 'lead_4', name: 'Ana Costa', email: 'ana.costa@emailaleatorio.com', avatar: 'https://placehold.co/40x40/caffbf/333?text=AC', joinDate: '25/06/2024', lastActivity: '2 semanas atrás' },
  { id: 'lead_5', name: 'Lucas Pereira', email: 'lucas.pereira@emailaleatorio.com', avatar: 'https://placehold.co/40x40/ffc8dd/333?text=LP', joinDate: '10/06/2024', lastActivity: '1 mês atrás' },
];

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  useEffect(() => {
    document.title = `Leads - ${APP_NAME}`;
  }, []);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendOffer = (lead: Lead) => {
    toast({
        title: "Enviar Oferta (Simulação)",
        description: `Uma oferta promocional seria enviada para ${lead.name}.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leads (Plano Gratuito)"
        icon={<Users />}
        description="Visualize e gerencie usuários do plano gratuito para campanhas de conversão."
      />
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários Gratuitos</CardTitle>
          <div className="flex justify-between items-center pt-2">
            <CardDescription>
                {filteredLeads.length} de {leads.length} usuários encontrados.
            </CardDescription>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Data de Inscrição</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={lead.avatar} data-ai-hint="user avatar" />
                        <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{lead.joinDate}</TableCell>
                  <TableCell>{lead.lastActivity}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleSendOffer(lead)}><Gift className="mr-2 h-4 w-4" />Enviar Oferta</DropdownMenuItem>
                            <DropdownMenuItem><User className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Remover Usuário</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
