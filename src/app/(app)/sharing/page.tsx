"use client";

import { useCallback, useEffect, useState } from 'react';
import { Share2, PlusCircle, Send, Users, Trophy, Target, ListChecks, ArrowRightLeft, NotebookPen, CalendarDays, Users2, KanbanSquare, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/auth-context';

type ModuleSection = 'goals' | 'budgets' | 'todos' | 'transactions' | 'notepad' | 'calendar' | 'clients' | 'kanban';
type Permission = 'view' | 'edit';
type Status = 'pending' | 'accepted';
interface Share { id: string; permission: Permission; status: Status }
interface Module { id: string; name: string; sections: ModuleSection[]; owner: 'me' | 'other'; ownerName: string; shares: Share[] }

const sections: Record<ModuleSection, { label: string; icon: typeof Trophy }> = {
  goals: { label: 'Metas', icon: Trophy }, budgets: { label: 'Orçamentos', icon: Target }, todos: { label: 'Tarefas', icon: ListChecks },
  transactions: { label: 'Receitas/Despesas', icon: ArrowRightLeft }, notepad: { label: 'Anotações', icon: NotebookPen }, calendar: { label: 'Calendário', icon: CalendarDays },
  clients: { label: 'Clientes', icon: Users2 }, kanban: { label: 'Kanban', icon: KanbanSquare },
};

export default function SharingPage() {
  const { session } = useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [current, setCurrent] = useState<Module | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<ModuleSection[]>([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Permission>('view');

  const request = async (body?: Record<string, unknown>) => {
    const response = await fetch('/api/sharing', body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
    return data;
  };

  const load = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await request();
      const mine = (data.owned || []).map((m: any): Module => ({ id: m.id, name: m.name, sections: m.sections || [], owner: 'me', ownerName: 'Você', shares: (m.module_shares || []).map((s: any) => ({ id: s.id, permission: s.permission, status: s.status })) }));
      const received = (data.received || []).map((s: any): Module => ({ id: s.sharing_modules.id, name: s.sharing_modules.name, sections: s.sharing_modules.sections || [], owner: 'other', ownerName: data.ownerNames?.[s.sharing_modules.owner_id] || 'Outro usuário', shares: [{ id: s.id, permission: s.permission, status: s.status }] }));
      setModules([...mine, ...received]);
    } catch (error: any) { toast({ title: 'Erro ao carregar compartilhamentos', description: error.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [session?.user]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (name.trim().length < 3 || !selected.length) return toast({ title: 'Preencha o nome e selecione ao menos uma seção.', variant: 'destructive' });
    try { await request({ action: 'create', name, sections: selected }); setCreateOpen(false); setName(''); setSelected([]); await load(); toast({ title: 'Módulo criado' }); }
    catch (error: any) { toast({ title: 'Erro ao criar módulo', description: error.message, variant: 'destructive' }); }
  };
  const invite = async () => {
    if (!current || !email) return;
    try { const data = await request({ action: 'invite', moduleId: current.id, email, permission }); setInviteOpen(false); setEmail(''); await load(); toast({ title: 'Convite enviado', description: `${data.recipientEmail} receberá uma notificação.` }); }
    catch (error: any) { toast({ title: 'Erro ao enviar convite', description: error.message, variant: 'destructive' }); }
  };
  const act = async (action: 'accept' | 'leave', module: Module) => {
    try {
      await request({ action, shareId: module.shares[0]?.id });
      if (action === 'accept') {
        const prior = JSON.parse(localStorage.getItem('flortune-shared-sections') || '[]');
        localStorage.setItem('flortune-shared-sections', JSON.stringify([...new Set([...prior, ...module.sections])]));
        window.dispatchEvent(new Event('flortune-shared-modules-updated'));
      }
      await load(); toast({ title: action === 'accept' ? 'Convite aceito' : 'Convite removido' });
    } catch (error: any) { toast({ title: 'Erro no compartilhamento', description: error.message, variant: 'destructive' }); }
  };
  const mine = modules.filter(m => m.owner === 'me');
  const received = modules.filter(m => m.owner === 'other');

  return <div className="flex h-full flex-col">
    <PageHeader title="Meus Módulos" description="Crie módulos, compartilhe com outros usuários e gerencie seus acessos." icon={<Share2 className="h-6 w-6 text-primary" />} actions={<Button onClick={() => setCreateOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Criar módulo</Button>} />
    <Tabs defaultValue="mine" className="flex-1"><TabsList><TabsTrigger value="mine">Compartilhados por mim ({mine.length})</TabsTrigger><TabsTrigger value="received">Compartilhados comigo ({received.length})</TabsTrigger></TabsList>
      <TabsContent value="mine"><ModuleList modules={mine} loading={loading} onInvite={m => { setCurrent(m); setInviteOpen(true); }} onAction={act} /></TabsContent>
      <TabsContent value="received"><ModuleList modules={received} loading={loading} onAction={act} /></TabsContent>
    </Tabs>
    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>Criar novo módulo</DialogTitle><DialogDescription>Escolha os dados que poderão ser compartilhados.</DialogDescription></DialogHeader><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">{Object.entries(sections).map(([key, value]) => <Label key={key} className="flex items-center gap-2 font-normal"><Checkbox checked={selected.includes(key as ModuleSection)} onCheckedChange={() => setSelected(p => p.includes(key as ModuleSection) ? p.filter(s => s !== key) : [...p, key as ModuleSection])} />{value.label}</Label>)}</div><DialogFooter><Button onClick={create}>Criar módulo</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogContent><DialogHeader><DialogTitle>Convidar para {current?.name}</DialogTitle><DialogDescription>O destinatário precisa ter uma conta no Flortune.</DialogDescription></DialogHeader><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /><Label>Permissão</Label><Select value={permission} onValueChange={v => setPermission(v as Permission)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="view">Visualizar apenas</SelectItem><SelectItem value="edit">Visualizar e editar</SelectItem></SelectContent></Select><DialogFooter><Button onClick={invite}><Send className="mr-2 h-4 w-4" />Enviar convite</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function ModuleList({ modules, loading, onInvite, onAction }: { modules: Module[]; loading: boolean; onInvite?: (m: Module) => void; onAction: (a: 'accept' | 'leave', m: Module) => void }) {
  if (loading) return <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando módulos...</CardContent></Card>;
  if (!modules.length) return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum módulo nesta lista.</CardContent></Card>;
  return <div className="mt-4 grid gap-3">{modules.map(module => { const pending = module.shares.some(s => s.status === 'pending'); return <Card key={`${module.owner}-${module.id}`}><CardHeader className="pb-3"><CardTitle className="flex flex-wrap items-center gap-2 text-base"><Share2 className="h-4 w-4 text-primary" />{module.name}<Badge variant={pending ? 'amber' : 'default'}>{pending ? 'Convite pendente' : 'Compartilhado'}</Badge></CardTitle></CardHeader><CardContent className="flex flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground">Proprietário: {module.ownerName}</span><div className="flex gap-2">{module.sections.map(key => { const Icon = sections[key].icon; return <Icon key={key} className="h-4 w-4" aria-label={sections[key].label} />; })}</div><div className="ml-auto flex gap-2">{module.owner === 'me' ? <Button size="sm" variant="outline" onClick={() => onInvite?.(module)}><Users className="mr-2 h-4 w-4" />Convidar</Button> : pending ? <><Button size="sm" onClick={() => onAction('accept', module)}>Aceitar</Button><Button size="sm" variant="outline" onClick={() => onAction('leave', module)}><Trash2 className="mr-2 h-4 w-4" />Recusar</Button></> : <Button size="sm" variant="outline" onClick={() => onAction('leave', module)}><Trash2 className="mr-2 h-4 w-4" />Sair</Button>}</div></CardContent></Card>; })}</div>;
}
