// src/app/(admin)/admin/leads/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Users, Search, MoreHorizontal, Gift, User, Send, Calendar, Clock, MailIcon, Ban, CheckCircle } from "lucide-react";
import { APP_NAME, PRICING_TIERS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  lastActivity: string;
  status: 'active' | 'do_not_contact';
}

const mockLeads: Lead[] = [
  { id: 'lead_1', name: 'João da Silva', email: 'joao.silva@emailaleatorio.com', avatar: 'https://placehold.co/40x40/a2d2ff/333?text=JS', joinDate: '20/07/2024', lastActivity: '3 dias atrás', status: 'active' },
  { id: 'lead_2', name: 'Maria Oliveira', email: 'maria.oliveira@emailaleatorio.com', avatar: 'https://placehold.co/40x40/bde0fe/333?text=MO', joinDate: '15/07/2024', lastActivity: 'Hoje', status: 'active' },
  { id: 'lead_3', name: 'Pedro Santos', email: 'pedro.santos@emailaleatorio.com', avatar: 'https://placehold.co/40x40/ffafcc/333?text=PS', joinDate: '01/07/2024', lastActivity: '1 semana atrás', status: 'do_not_contact' },
  { id: 'lead_4', name: 'Ana Costa', email: 'ana.costa@emailaleatorio.com', avatar: 'https://placehold.co/40x40/caffbf/333?text=AC', joinDate: '25/06/2024', lastActivity: '2 semanas atrás', status: 'active' },
  { id: 'lead_5', name: 'Lucas Pereira', email: 'lucas.pereira@emailaleatorio.com', avatar: 'https://placehold.co/40x40/ffc8dd/333?text=LP', joinDate: '10/06/2024', lastActivity: '1 mês atrás', status: 'active' },
];

const availablePaidPlans = PRICING_TIERS.filter(tier => tier.priceMonthly !== 'Grátis');

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);


  useEffect(() => {
    document.title = `Leads - ${APP_NAME}`;
  }, []);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenOfferDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsOfferDialogOpen(true);
  };
  
  const handleOpenDetailsDialog = (lead: Lead) => {
    setDetailsLead(lead);
  };

  const handleSendOfferSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
        title: "Proposta Enviada! (Simulação)",
        description: `A oferta foi enviada com sucesso para ${selectedLead?.email}.`,
    });
    setIsOfferDialogOpen(false);
  };

  const handleToggleStatus = (leadId: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead => {
        if (lead.id === leadId) {
          const newStatus = lead.status === 'active' ? 'do_not_contact' : 'active';
          toast({
            title: newStatus === 'do_not_contact' ? "Lead Marcado" : "Lead Reativado",
            description: `O usuário ${lead.name} foi atualizado.`,
          });
          return { ...lead, status: newStatus };
        }
        return lead;
      })
    );
  };


  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Leads (Plano Gratuito)"
          icon={<Users />}
          description="Visualize e gerencie usuários do plano gratuito para campanhas de conversão."
        />
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                <div className="flex-1">
                    <CardTitle>Lista de Usuários Gratuitos</CardTitle>
                    <CardDescription>
                        {filteredLeads.length} de {leads.length} usuários encontrados.
                    </CardDescription>
                </div>
              <div className="relative w-full sm:max-w-xs">
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
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="min-w-[250px]">Usuário</TableHead>
                    <TableHead className="min-w-[150px]">Data de Inscrição</TableHead>
                    <TableHead className="min-w-[150px]">Última Atividade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className={cn(lead.status === 'do_not_contact' && 'bg-destructive/10 opacity-70 hover:bg-destructive/20')}>
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
                                <DropdownMenuItem onClick={() => handleOpenOfferDialog(lead)} disabled={lead.status === 'do_not_contact'}><Gift className="mr-2 h-4 w-4" />Enviar Oferta</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDetailsDialog(lead)}><User className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className={cn(lead.status === 'active' ? 'text-destructive focus:text-destructive' : 'text-emerald-600 focus:text-emerald-600')}
                                    onClick={() => handleToggleStatus(lead.id)}
                                >
                                    {lead.status === 'active' ? (
                                    <><Ban className="mr-2 h-4 w-4" />Não Enviar Ofertas</>
                                    ) : (
                                    <><CheckCircle className="mr-2 h-4 w-4" />Reativar Ofertas</>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={!!detailsLead} onOpenChange={(open) => !open && setDetailsLead(null)}>
        <DialogContent>
          <DialogHeader>
             <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={detailsLead?.avatar} data-ai-hint="user avatar" />
                  <AvatarFallback>{detailsLead?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="font-headline text-xl">{detailsLead?.name}</DialogTitle>
                    <DialogDescription>Detalhes do lead e atividade.</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <MailIcon className="h-4 w-4" />
                <span>{detailsLead?.email}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Entrou em: {detailsLead?.joinDate}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Última atividade: {detailsLead?.lastActivity}</span>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Criar Oferta Personalizada</DialogTitle>
            <DialogDescription>
              Enviando oferta para: <span className="font-semibold text-primary">{selectedLead?.name} ({selectedLead?.email})</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendOfferSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="targetPlan">Plano de Destino</Label>
                <Select defaultValue={availablePaidPlans[0]?.id}>
                  <SelectTrigger id="targetPlan"><SelectValue placeholder="Selecione um plano..." /></SelectTrigger>
                  <SelectContent>{availablePaidPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.priceMonthly})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offerTitle">Título da Oferta</Label>
                <Input id="offerTitle" placeholder="Ex: Sua Primeira Mensalidade por Nossa Conta!" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offerPrice">Preço Promocional (R$)</Label>
                  <Input id="offerPrice" type="number" step="0.01" placeholder="Ex: 9.90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerDuration">Duração (meses)</Label>
                  <Input id="offerDuration" type="number" placeholder="Ex: 3" />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="offerMessage">Mensagem (Opcional)</Label>
                  <Textarea id="offerMessage" placeholder="Adicione uma mensagem pessoal para incentivar a conversão." />
              </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit"><Send className="mr-2 h-4 w-4"/>Enviar Proposta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
