// src/app/(app)/sharing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Share2, 
  PlusCircle, 
  Trash2, 
  Users, 
  Send, 
  Package, 
  Settings, 
  Trophy, 
  Target, 
  ListChecks, 
  ArrowRightLeft,
  Info,
  NotebookPen,
  CalendarDays,
  Users2,
  KanbanSquare,
  MoreHorizontal
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SharedAccess {
  id: string;
  email: string;
  permission: "view" | "edit";
}

type ModuleSection = 'goals' | 'budgets' | 'todos' | 'transactions' | 'notepad' | 'calendar' | 'clients' | 'kanban';

interface Module {
  id: string;
  name: string;
  sharedWith: SharedAccess[];
  sections: ModuleSection[];
  createdAt: string;
  updatedAt: string;
  owner: 'me' | 'other';
  ownerName?: string; 
}

const sectionConfig: Record<ModuleSection, { label: string; icon: React.ElementType }> = {
  goals: { label: "Metas", icon: Trophy },
  budgets: { label: "Orçamentos", icon: Target },
  todos: { label: "Tarefas", icon: ListChecks },
  transactions: { label: "Receitas/Despesas", icon: ArrowRightLeft },
  notepad: { label: "Anotações", icon: NotebookPen },
  calendar: { label: "Calendário", icon: CalendarDays },
  clients: { label: "Clientes", icon: Users2 },
  kanban: { label: "Kanban", icon: KanbanSquare },
};

const initialModules: Module[] = [
  { 
    id: "mod_1", 
    name: "Finanças da Casa", 
    sharedWith: [{ id: "access_1", email: "parceiro@example.com", permission: "edit" }],
    sections: ['budgets', 'transactions', 'todos'],
    createdAt: "2024-07-20T10:00:00Z",
    updatedAt: "2024-07-25T14:30:00Z",
    owner: 'me',
    ownerName: "Você"
  },
  { 
    id: "mod_2", 
    name: "Projeto Freelance Cliente X", 
    sharedWith: [
      { id: "access_2", email: "cliente@example.com", permission: "view" },
      { id: "access_3", email: "dev-colega@example.com", permission: "edit" },
    ],
    sections: ['transactions', 'clients', 'kanban'],
    createdAt: "2024-06-15T09:00:00Z",
    updatedAt: "2024-07-22T11:00:00Z",
    owner: 'me',
    ownerName: "Você"
  },
  {
    id: "mod_3",
    name: "Metas de Viagem (com Amigos)",
    sharedWith: [],
    sections: ['goals'],
    createdAt: "2024-05-10T18:00:00Z",
    updatedAt: "2024-05-10T18:00:00Z",
    owner: 'other',
    ownerName: "Ana S."
  }
];

export default function SharingPage() {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [selectedSections, setSelectedSections] = useState<ModuleSection[]>([]);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"view" | "edit">("view");

  const [isKanbanConfirmOpen, setIsKanbanConfirmOpen] = useState(false);
  const [moduleToLeave, setModuleToLeave] = useState<Module | null>(null);

  useEffect(() => {
    document.title = `Meus Módulos - ${APP_NAME}`;
  }, []);

  const handleSectionToggle = (section: ModuleSection) => {
    setSelectedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleCreateModule = () => {
    if (newModuleName.trim().length < 3) {
      toast({ title: "Nome Inválido", description: "O nome do módulo deve ter pelo menos 3 caracteres.", variant: "destructive" });
      return;
    }
     if (selectedSections.length === 0) {
      toast({ title: "Nenhuma Seção Selecionada", description: "Você deve selecionar pelo menos uma seção para compartilhar.", variant: "destructive" });
      return;
    }

    const newModule: Module = { 
        id: `mod_${Date.now()}`, 
        name: newModuleName, 
        sharedWith: [],
        sections: selectedSections,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: 'me',
        ownerName: "Você"
    };
    setModules(prev => [newModule, ...prev]);
    toast({ title: "Módulo Criado!", description: `O módulo "${newModuleName}" foi criado com sucesso.`});
    setIsModuleModalOpen(false);
    setNewModuleName("");
    setSelectedSections([]);
  };

  const openInviteModal = (module: Module) => {
    setCurrentModule(module);
    setInviteEmail('');
    setInvitePermission('view');
    setIsInviteModalOpen(true);
  }

  const proceedWithInvite = () => {
     if (!currentModule || !inviteEmail) {
      toast({ title: "Dados incompletos", variant: "destructive" });
      return;
    }
    const newAccess: SharedAccess = { id: `access_${Date.now()}`, email: inviteEmail, permission: invitePermission };
    setModules(prev => prev.map(m => m.id === currentModule.id ? { ...m, sharedWith: [...m.sharedWith, newAccess] } : m));
    toast({ title: "Convite Enviado", description: `${inviteEmail} foi convidado para o módulo "${currentModule.name}".`});
    setInviteEmail("");
    setIsInviteModalOpen(false);
  }

  const handleInvite = () => {
    if (currentModule?.sections.includes('kanban')) {
        setIsKanbanConfirmOpen(true);
    } else {
        proceedWithInvite();
    }
  }

  const handleLeaveModuleConfirm = () => {
    if(!moduleToLeave) return;
    setModules(prev => prev.filter(m => m.id !== moduleToLeave.id));
    toast({ title: "Você saiu do módulo", description: `Você não tem mais acesso a "${moduleToLeave.name}".`});
    setModuleToLeave(null);
  }
  
  const modulesByMe = modules.filter(m => m.owner === 'me');
  const modulesWithMe = modules.filter(m => m.owner === 'other');

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Meus Módulos"
          description="Crie módulos, compartilhe com outros usuários e gerencie seus acessos."
          icon={<Share2 className="h-6 w-6 text-primary" />}
          actions={<Button onClick={() => setIsModuleModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Criar Módulo</Button>}
        />
        <Tabs defaultValue="my-modules" className="flex-grow flex flex-col">
          <TabsList className="self-start">
            <TabsTrigger value="my-modules">Módulos que eu compartilhei ({modulesByMe.length})</TabsTrigger>
            <TabsTrigger value="shared-with-me">Compartilhados comigo ({modulesWithMe.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="my-modules" className="flex-grow mt-4">
            <ModuleTable modules={modulesByMe} onInvite={openInviteModal} title="Módulos Criados por Você"/>
          </TabsContent>
          <TabsContent value="shared-with-me" className="flex-grow mt-4">
            <ModuleTable modules={modulesWithMe} onLeave={setModuleToLeave} title="Módulos que Outros Compartilharam com Você"/>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-headline">Criar Novo Módulo</DialogTitle><DialogDescription>Dê um nome e escolha quais seções este módulo irá conter.</DialogDescription></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="module-name">Nome do Módulo</Label>
                  <Input id="module-name" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} placeholder="Ex: Finanças da Casa" />
              </div>
              <div className="space-y-2">
                <Label>Seções para Compartilhar</Label>
                <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                  {Object.entries(sectionConfig).map(([key, {label, icon: Icon}]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox id={`section-${key}`} onCheckedChange={() => handleSectionToggle(key as ModuleSection)} checked={selectedSections.includes(key as ModuleSection)}/>
                      <Label htmlFor={`section-${key}`} className="flex items-center gap-2 font-normal text-sm cursor-pointer"><Icon className="h-4 w-4 text-muted-foreground"/>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleCreateModule}>Criar Módulo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle className="font-headline">Gerenciar Acesso: {currentModule?.name}</DialogTitle><DialogDescription>Convide um usuário e defina suas permissões para este módulo.</DialogDescription></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2"><Label htmlFor="invite-email">Email do Convidado</Label><Input id="invite-email" type="email" placeholder="nome@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="invite-permission">Nível de Permissão</Label><Select value={invitePermission} onValueChange={(v) => setInvitePermission(v as 'view' | 'edit')}><SelectTrigger id="invite-permission"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="view">Visualizar Apenas</SelectItem><SelectItem value="edit">Visualizar e Editar</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleInvite}><Send className="mr-2 h-4 w-4"/>Enviar Convite</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isKanbanConfirmOpen} onOpenChange={setIsKanbanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Compartilhamento do Kanban</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza? Compartilhar um módulo que inclui o Quadro Kanban irá **substituir** o quadro local do usuário convidado para manter os dados sincronizados. Esta ação não pode ser desfeita para o destinatário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { proceedWithInvite(); setIsKanbanConfirmOpen(false); }}>
              Sim, enviar convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!moduleToLeave} onOpenChange={(open) => !open && setModuleToLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do Módulo</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja sair do módulo "{moduleToLeave?.name}"? Você perderá o acesso a todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveModuleConfirm}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TooltipProvider>
  );
}


interface ModuleTableProps {
  modules: Module[];
  onInvite?: (module: Module) => void;
  onLeave?: (module: Module) => void;
  title: string;
}

function ModuleTable({ modules, onInvite, onLeave, title }: ModuleTableProps) {
  if (modules.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-8 border-dashed h-full">
         <Info className="h-10 w-10 text-muted-foreground mb-2"/>
        <h3 className="font-semibold text-lg">{title === "Módulos Criados por Você" ? "Você ainda não criou módulos" : "Nenhum módulo compartilhado com você"}</h3>
        <p className="text-muted-foreground text-sm">Crie um módulo para começar a compartilhar.</p>
      </Card>
    );
  }

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="md:hidden grid gap-4">
          {modules.map(module => (
            <div key={module.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <p className="font-medium flex items-center gap-2"><Package className="h-4 w-4 text-primary"/>{module.name}</p>
                <ModuleActions module={module} onInvite={onInvite} onLeave={onLeave} />
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Proprietário:</span> <span className="font-medium">{module.ownerName}</span></div>
                <div className="flex justify-between"><span>Alterado:</span> <span>{format(new Date(module.updatedAt), "dd/MM/yy")}</span></div>
                <div>
                  <span className="font-medium">Itens:</span>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {module.sections.map(sectionKey => {
                      const config = sectionConfig[sectionKey];
                      return <Tooltip key={sectionKey}><TooltipTrigger><config.icon className="h-4 w-4"/></TooltipTrigger><TooltipContent><p>{config.label}</p></TooltipContent></Tooltip>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Módulo</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Alteração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map(module => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium flex items-center gap-2"><Package className="h-4 w-4 text-primary"/>{module.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {module.sections.map(sectionKey => {
                        const config = sectionConfig[sectionKey];
                        return <Tooltip key={sectionKey}><TooltipTrigger><config.icon className="h-4 w-4 text-muted-foreground"/></TooltipTrigger><TooltipContent><p>{config.label}</p></TooltipContent></Tooltip>;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>{module.ownerName}</TableCell>
                  <TableCell>{format(new Date(module.updatedAt), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <ModuleActions module={module} onInvite={onInvite} onLeave={onLeave} />
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

function ModuleActions({module, onInvite, onLeave}: {module: Module, onInvite?: (m: Module) => void, onLeave?: (m: Module) => void}) {
  if(module.owner === 'me') {
    return (
      <Button variant="outline" size="sm" onClick={() => onInvite?.(module)}>
        <Users className="mr-2 h-4 w-4"/>Convidar
      </Button>
    )
  }
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onLeave?.(module)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4"/>Sair do Módulo
          </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
