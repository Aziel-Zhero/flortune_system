
"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Users, Search, MoreHorizontal, Gift, User, Send, Calendar, Clock, MailIcon, Ban, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { APP_NAME, PRICING_TIERS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, add, differenceInSeconds } from 'date-fns';
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";

interface Lead extends Profile {
  status: 'active' | 'do_not_contact';
}

interface ProposedLead extends Lead {
  proposalDate: string;
  proposalExpiresAt: string;
}

const availablePaidPlans = PRICING_TIERS.filter(tier => tier.priceMonthly !== 'Grátis');

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposedLeads, setProposedLeads] = useState<ProposedLead[]>([]);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealLeads = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      // Leads são usuários no plano gratuito
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('plan_id', 'tier-cultivador')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []).map(l => ({ ...l, status: 'active' })));
    } catch (err: any) {
      toast({ title: "Erro ao buscar leads", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = `Leads - ${APP_NAME}`;
    fetchRealLeads();
  }, []);

  const filteredLeads = useMemo(() => 
    leads.filter(
      (lead) =>
        (lead.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (lead.display_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
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

    toast({ title: "Proposta Enviada!", description: `A oferta foi enviada para ${selectedLead.email}.` });
    
    setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
    const now = new Date();
    setProposedLeads(prev => [
      ...prev,
      {
        ...selectedLead,
        proposalDate: now.toISOString(),
        proposalExpiresAt: add(now, { minutes: 5 }).toISOString(),
      }
    ]);

    setIsOfferDialogOpen(false);
    setSelectedLead(null);
  };

  const handleToggleStatus = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
        if (lead.id === leadId) {
          const newStatus = lead.status === 'active' ? 'do_not_contact' : 'active';
          return { ...lead, status: newStatus };
        }
        return lead;
    }));
  };
  
  const handleReturnToList = (leadToReturn: ProposedLead) => {
    setProposedLeads(prev => prev.filter(pl => pl.id !== leadToReturn.id));
    const { proposalDate, proposalExpiresAt, ...originalLead } = leadToReturn;
    setLeads(prev => [originalLead, ...prev]);
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1850px] mx-auto w-full">
      <div className="space-y-8">
        <PageHeader
          title="Leads (Plano Gratuito)"
          icon={<Users />}
          description="Visualize e gerencie usuários reais do plano gratuito para conversão."
        />
        
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Disponíveis ({filteredLeads.length})</TabsTrigger>
            <TabsTrigger value="proposed">Propostas Enviadas ({proposedLeads.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                            <CardTitle>Lista de Usuários Gratuitos</CardTitle>
                            <CardDescription>Usuários capturados em tempo real.</CardDescription>
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
                                <TableHead>Data de Inscrição</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeads.map((lead) => (
                                <TableRow key={lead.id} className={cn(lead.status === 'do_not_contact' && 'opacity-60 grayscale')}>
                                    <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                        <AvatarImage src={lead.avatar_url || ''} data-ai-hint="user avatar" />
                                        <AvatarFallback>{(lead.display_name || lead.email).charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{lead.display_name || 'Sem Nome'}</p>
                                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                                        </div>
                                    </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenOfferDialog(lead)} disabled={lead.status === 'do_not_contact'}><Gift className="mr-2 h-4 w-4" />Enviar Oferta</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDetailsDialog(lead)}><User className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className={cn(lead.status === 'active' ? 'text-destructive' : 'text-emerald-600')}
                                                onClick={() => handleToggleStatus(lead.id)}
                                            >
                                                {lead.status === 'active' ? <><Ban className="mr-2 h-4 w-4" />Bloquear Ofertas</> : <><CheckCircle className="mr-2 h-4 w-4" />Reativar</>}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))}
                                {filteredLeads.length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Nenhum lead encontrado.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposed" className="mt-6">
             <ProposedLeadsTable proposedLeads={proposedLeads} onReturnToList={handleReturnToList} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogs */}
      <Dialog open={!!detailsLead} onOpenChange={(open) => !open && setDetailsLead(null)}>
        <DialogContent>
          <DialogHeader>
             <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={detailsLead?.avatar_url || ''} data-ai-hint="user avatar" />
                  <AvatarFallback>{(detailsLead?.display_name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="font-headline text-xl">{detailsLead?.display_name || detailsLead?.email}</DialogTitle>
                    <DialogDescription>Detalhes reais do perfil do usuário.</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><MailIcon className="h-4 w-4" /><span>{detailsLead?.email}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span>Cadastrado em: {detailsLead ? format(new Date(detailsLead.created_at), 'dd/MM/yyyy HH:mm') : '-'}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>Última atualização: {detailsLead ? format(new Date(detailsLead.updated_at), 'dd/MM/yyyy HH:mm') : '-'}</span></div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Criar Oferta Personalizada</DialogTitle>
            <DialogDescription>Enviando para: <span className="font-semibold text-primary">{selectedLead?.email}</span></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendOfferSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plano de Destino</Label>
                <Select defaultValue={availablePaidPlans[0]?.id}>
                  <SelectTrigger><SelectValue placeholder="Selecione um plano..." /></SelectTrigger>
                  <SelectContent>{availablePaidPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.priceMonthly})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Título da Oferta</Label><Input placeholder="Ex: Cupom de 50% de Desconto!" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" placeholder="9.90" /></div>
                <div className="space-y-2"><Label>Duração (meses)</Label><Input type="number" placeholder="3" /></div>
              </div>
              <div className="space-y-2"><Label>Mensagem</Label><Textarea placeholder="Escreva algo especial para este usuário..." /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit"><Send className="mr-2 h-4 w-4"/>Enviar Proposta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProposedLeadsTable({ proposedLeads, onReturnToList }: { proposedLeads: ProposedLead[], onReturnToList: (l: ProposedLead) => void }) {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <Card>
            <CardHeader><CardTitle>Propostas em Aberto</CardTitle><CardDescription>Acompanhe o tempo de validade das ofertas enviadas.</CardDescription></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Enviado em</TableHead><TableHead>Expira em</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {proposedLeads.map(lead => {
                            const expiresAt = new Date(lead.proposalExpiresAt);
                            const secondsLeft = differenceInSeconds(expiresAt, now);
                            const isExpired = secondsLeft <= 0;
                            return (
                                <TableRow key={lead.id}>
                                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={lead.avatar_url || ''} /><AvatarFallback>U</AvatarFallback></Avatar><div><p className="text-sm font-medium">{lead.email}</p></div></div></TableCell>
                                    <TableCell className="text-sm">{format(new Date(lead.proposalDate), 'HH:mm:ss')}</TableCell>
                                    <TableCell className={cn("text-sm font-mono", isExpired ? "text-muted-foreground" : "text-destructive animate-pulse")}>
                                        {isExpired ? "Expirada" : `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isExpired && <Button size="sm" variant="ghost" onClick={() => onReturnToList(lead)}><RotateCcw className="h-4 w-4 mr-1"/> Voltar</Button>}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {proposedLeads.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhuma proposta enviada.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
