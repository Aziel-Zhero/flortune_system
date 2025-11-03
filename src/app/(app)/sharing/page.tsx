// src/app/(app)/sharing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Share2, PlusCircle, Trash2, UserPlus, Send, Package, Users } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SharedAccess {
  id: string;
  email: string;
  permission: "view" | "edit";
}

interface Module {
  id: string;
  name: string;
  sharedWith: SharedAccess[];
}

const initialModules: Module[] = [
  { 
    id: "mod_1", 
    name: "Finanças da Casa", 
    sharedWith: [
      { id: "access_1", email: "parceiro@example.com", permission: "edit" }
    ] 
  },
  { 
    id: "mod_2", 
    name: "Projeto Freelance Cliente X", 
    sharedWith: [
      { id: "access_2", email: "cliente@example.com", permission: "view" },
      { id: "access_3", email: "dev-colega@example.com", permission: "edit" },
    ]
  },
  {
    id: "mod_3",
    name: "Orçamento Pessoal",
    sharedWith: []
  }
];

export default function SharingPage() {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"view" | "edit">("view");

  useEffect(() => {
    document.title = `Compartilhamento - ${APP_NAME}`;
  }, []);

  const handleCreateModule = () => {
    if (newModuleName.trim().length < 3) {
      toast({ title: "Nome Inválido", description: "O nome do módulo deve ter pelo menos 3 caracteres.", variant: "destructive" });
      return;
    }
    const newModule: Module = { id: `mod_${Date.now()}`, name: newModuleName, sharedWith: [] };
    setModules(prev => [newModule, ...prev]);
    toast({ title: "Módulo Criado!", description: `O módulo "${newModuleName}" foi criado com sucesso.`});
    setIsModuleModalOpen(false);
    setNewModuleName("");
  };

  const openInviteModal = (module: Module) => {
    setCurrentModule(module);
    setIsInviteModalOpen(true);
  }

  const handleInvite = () => {
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

  const handleRevokeAccess = (moduleId: string, accessId: string) => {
    setModules(prev => prev.map(m => m.id === moduleId ? {...m, sharedWith: m.sharedWith.filter(s => s.id !== accessId)} : m));
    toast({ title: "Acesso Revogado" });
  }

  return (
    <Dialog open={isModuleModalOpen || isInviteModalOpen} onOpenChange={(open) => { if (!open) { setIsModuleModalOpen(false); setIsInviteModalOpen(false); } }}>
      <PageHeader
        title="Gestão de Módulos e Compartilhamento"
        description="Crie módulos e compartilhe o acesso com outros usuários."
        icon={<Share2 className="h-6 w-6 text-primary" />}
        actions={<Button onClick={() => setIsModuleModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Criar Módulo</Button>}
      />
      <div className="space-y-8">
        {modules.map(module => (
          <Card key={module.id} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="font-headline flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary"/>
                  {module.name}
                </CardTitle>
                <CardDescription>
                  {module.sharedWith.length > 0 ? `Compartilhado com ${module.sharedWith.length} usuário(s).` : "Este módulo é privado."}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => openInviteModal(module)}>
                <Users className="mr-2 h-4 w-4"/>Gerenciar
              </Button>
            </CardHeader>
            {module.sharedWith.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Permissão</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {module.sharedWith.map(access => (
                      <TableRow key={access.id}>
                        <TableCell>{access.email}</TableCell>
                        <TableCell><Badge variant={access.permission === 'edit' ? 'default' : 'secondary'}>{access.permission === 'edit' ? 'Editar' : 'Visualizar'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRevokeAccess(module.id, access.id)}><Trash2 className="h-4 w-4"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Dialog para criar módulo */}
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">Criar Novo Módulo</DialogTitle><DialogDescription>Dê um nome ao seu novo módulo compartilhável (ex: "Finanças da Casa").</DialogDescription></DialogHeader>
        <div className="py-4 space-y-2"><Label htmlFor="module-name">Nome do Módulo</Label><Input id="module-name" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} /></div>
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleCreateModule}>Criar Módulo</Button></DialogFooter>
      </DialogContent>
      
      {/* Dialog para convidar usuário */}
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">Gerenciar Acesso: {currentModule?.name}</DialogTitle><DialogDescription>Convide um usuário e defina suas permissões para este módulo.</DialogDescription></DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2"><Label htmlFor="invite-email">Email do Convidado</Label><Input id="invite-email" type="email" placeholder="nome@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="invite-permission">Nível de Permissão</Label><Select value={invitePermission} onValueChange={(v) => setInvitePermission(v as 'view' | 'edit')}><SelectTrigger id="invite-permission"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="view">Visualizar Apenas</SelectItem><SelectItem value="edit">Visualizar e Editar</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleInvite}><Send className="mr-2 h-4 w-4"/>Enviar Convite</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
