// src/app/(admin)/admin/leads/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Users, Search, MoreHorizontal, Gift, User, Send, Calendar, Clock, MailIcon, Ban, CheckCircle, RotateCcw } from "lucide-react";
import { APP_NAME, PRICING_TIERS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, add, differenceInSeconds } from 'date-fns';

interface Lead {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  lastActivity: string;
  status: 'active' | 'do_not_contact';
}

interface ProposedLead extends Lead {
  proposalDate: string; // ISO string
  proposalExpiresAt: string; // ISO string
}

// MOCK DATA REMOVED
const mockLeads: Lead[] = [];

const availablePaidPlans = PRICING_TIERS.filter(tier => tier.priceMonthly !== 'Grátis');

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [proposedLeads, setProposedLeads] = useState<ProposedLead[]>([]);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);

  useEffect(() => {
    document.title = `Leads - ${APP_NAME}`;
  }, []);

  const filteredLeads = useMemo(() => 
    leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [leads, searchTerm]);

  const handleOpenOfferDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsOfferDialogOpen(true);
  };
  
  const handleOpenDetailsDialog = (lead: Lead) => {
    setDetailsLead(lead);
  };

  const handleSendOfferSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLead) return;

    toast({
        title: "Proposta Enviada! (Simulação)",
        description: `A oferta foi enviada com sucesso para ${selectedLead?.email}.`,
    });
    
    // Move lead from 'available' to 'proposed'
    setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
    const now = new Date();
    setProposedLeads(prev => [
      ...prev,
      {
        ...selectedLead,
        proposalDate: now.toISOString(),
        // For demonstration, expires in 1 minute
        proposalExpiresAt: add(now, { minutes: 1 }).toISOString(),
      }
    ]);

    setIsOfferDialogOpen(false);
    setSelectedLead(null);
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
  
  const handleReturnToList = (leadToReturn: ProposedLead) => {
    setProposedLeads(prev => prev.filter(pl => pl.id !== leadToReturn.id));
    // Remove proposal-specific fields before adding back to the main list
    const { proposalDate, proposalExpiresAt, ...originalLead } = leadToReturn;
    setLeads(prev => [...prev, originalLead]);
    toast({
        title: "Lead Retornado",
        description: `${leadToReturn.name} está disponível para novas propostas.`
    })
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Leads (Plano Gratuito)"
          icon={<Users />}
          description="Visualize e gerencie usuários do plano gratuito para campanhas de conversão."
        />
        
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Disponíveis para Oferta ({filteredLeads.length})</TabsTrigger>
            <TabsTrigger value="proposed">Propostas Enviadas ({proposedLeads.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available">
            <LeadsTable
                leads={filteredLeads}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onOpenOffer={handleOpenOfferDialog}
                onOpenDetails={handleOpenDetailsDialog}
                onToggleStatus={handleToggleStatus}
            />
          </TabsContent>

          <TabsContent value="proposed">
             <ProposedLeadsTable
                proposedLeads={proposedLeads}
                onReturnToList={handleReturnToList}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogs remain here */}
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


// --- Sub-componentes para as Tabelas ---

interface LeadsTableProps {
    leads: Lead[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onOpenOffer: (lead: Lead) => void;
    onOpenDetails: (lead: Lead) => void;
    onToggleStatus: (leadId: string) => void;
}

function LeadsTable({ leads, searchTerm, setSearchTerm, onOpenOffer, onOpenDetails, onToggleStatus }: LeadsTableProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                    <div className="flex-1">
                        <CardTitle>Lista de Usuários Gratuitos</CardTitle>
                        <CardDescription>
                            {leads.length} usuário(s) encontrado(s).
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
                            <TableHead className="min-w-[150px] hidden md:table-cell">Data de Inscrição</TableHead>
                            <TableHead className="min-w-[150px] hidden md:table-cell">Última Atividade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((lead) => (
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
                                        <div className="mt-1 flex flex-col md:hidden text-xs text-muted-foreground">
                                            <span>Inscrito em: {lead.joinDate}</span>
                                            <span>Atividade: {lead.lastActivity}</span>
                                        </div>
                                    </div>
                                </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{lead.joinDate}</TableCell>
                                <TableCell className="hidden md:table-cell">{lead.lastActivity}</TableCell>
                                <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onOpenOffer(lead)} disabled={lead.status === 'do_not_contact'}><Gift className="mr-2 h-4 w-4" />Enviar Oferta</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onOpenDetails(lead)}><User className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className={cn(lead.status === 'active' ? 'text-destructive focus:text-destructive' : 'text-emerald-600 focus:text-emerald-600')}
                                            onClick={() => onToggleStatus(lead.id)}
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
    );
}

interface ProposedLeadsTableProps {
    proposedLeads: ProposedLead[];
    onReturnToList: (lead: ProposedLead) => void;
}

function ProposedLeadsTable({ proposedLeads, onReturnToList }: ProposedLeadsTableProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Propostas Enviadas</CardTitle>
                <CardDescription>Acompanhe os leads que receberam uma oferta e o tempo de expiração.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px]">Usuário</TableHead>
                                <TableHead>Data da Proposta</TableHead>
                                <TableHead>Expira em</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proposedLeads.map(lead => {
                                const expiresAt = new Date(lead.proposalExpiresAt);
                                const secondsLeft = differenceInSeconds(expiresAt, now);
                                const isExpired = secondsLeft <= 0;

                                return (
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
                                    <TableCell>{format(new Date(lead.proposalDate), 'dd/MM/yyyy HH:mm')}</TableCell>
                                    <TableCell className={cn(isExpired ? "text-muted-foreground" : "text-destructive")}>
                                        {isExpired ? "Expirada" : `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isExpired && (
                                            <Button size="sm" variant="outline" onClick={() => onReturnToList(lead)}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Retornar à Lista
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
