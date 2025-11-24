// src/components/settings/share-module-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SharedUser {
  id: string;
  email: string;
  module: string;
  permission: "view" | "edit";
}

const initialSharedUsers: SharedUser[] = [
  { id: "shared_1", email: "amigo@example.com", module: "Orçamento Mensal", permission: "view" },
  { id: "shared_2", email: "contador@example.com", module: "Todas as Transações", permission: "edit" },
];

const availableModules = ["Orçamento Mensal", "Metas de Poupança", "Todas as Transações", "Análise de Gastos"];
const permissionLevels = [
  { value: "view", label: "Visualizar Apenas" },
  { value: "edit", label: "Visualizar e Editar" },
];

interface ShareModuleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ShareModuleDialog({ isOpen, onOpenChange }: ShareModuleDialogProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>(initialSharedUsers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<"view" | "edit">("view");

  const handleInviteUser = () => {
    if (!inviteEmail || !selectedModule) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o email do usuário e selecione um módulo.",
        variant: "destructive",
      });
      return;
    }
    // Simulação de convite
    const newUser: SharedUser = {
      id: `shared_${Date.now()}`,
      email: inviteEmail,
      module: selectedModule,
      permission: selectedPermission,
    };
    setSharedUsers(prev => [...prev, newUser]);
    toast({
      title: "Convite Enviado",
      description: `${inviteEmail} foi convidado para o módulo "${selectedModule}".`,
    });
    setInviteEmail("");
    setSelectedModule("");
    setSelectedPermission("view");
  };

  const handleRevokeAccess = (userId: string) => {
    const userToRevoke = sharedUsers.find(u => u.id === userId);
    setSharedUsers(prev => prev.filter(user => user.id !== userId));
    if (userToRevoke) {
        toast({
            title: "Acesso Revogado",
            description: `O acesso de ${userToRevoke.email} foi revogado.`,
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" />
            Compartilhar Módulos Financeiros
          </DialogTitle>
          <DialogDescription>
            Convide outros usuários para visualizar ou editar seus módulos financeiros.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
          <div className="space-y-4 p-1 border rounded-md">
            <h3 className="text-md font-semibold mb-2 px-3 pt-2">Convidar Novo Usuário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3">
              <div>
                <Label htmlFor="invite-email">Email do Usuário</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="select-module">Módulo para Compartilhar</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger id="select-module">
                    <SelectValue placeholder="Selecione um módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.map(mod => (
                      <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-3">
                <Label htmlFor="select-permission">Nível de Permissão</Label>
                <Select value={selectedPermission} onValueChange={(value) => setSelectedPermission(value as "view" | "edit")}>
                  <SelectTrigger id="select-permission">
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionLevels.map(perm => (
                      <SelectItem key={perm.value} value={perm.value}>{perm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="px-3 pb-2">
                <Button onClick={handleInviteUser} className="w-full md:w-auto">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Convite
                </Button>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2">Usuários com Acesso</h3>
            {sharedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum módulo compartilhado ainda.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-xs md:text-sm">{user.email}</TableCell>
                        <TableCell className="text-xs md:text-sm">{user.module}</TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {permissionLevels.find(p => p.value === user.permission)?.label}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRevokeAccess(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
