// src/app/(app)/profile/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Smartphone, FileText, Fingerprint, Save } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';

// Mock data since session is disabled
const mockProfile = {
  fullName: "Usuário Demonstração",
  displayName: "Usuário Demo",
  email: "demo@flortune.com",
  phone: "(11) 98765-4321",
  cpfCnpj: "123.456.789-00",
  rg: "12.345.678-9",
  avatarUrl: `https://placehold.co/100x100.png?text=D`,
  avatarFallback: "D",
  account_type: "pessoa"
};


export default function ProfilePage() {
  const [fullName, setFullName] = useState(mockProfile.fullName);
  const [displayName, setDisplayName] = useState(mockProfile.displayName);
  const [email, setEmail] = useState(mockProfile.email);
  const [phone, setPhone] = useState(mockProfile.phone);
  const [cpfCnpj, setCpfCnpj] = useState(mockProfile.cpfCnpj);
  const [rg, setRg] = useState(mockProfile.rg);
  const [avatarUrl, setAvatarUrl] = useState(mockProfile.avatarUrl);
  const [avatarFallback, setAvatarFallback] = useState(mockProfile.avatarFallback);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  useEffect(() => {
    document.title = `Meu Perfil - ${APP_NAME}`;
  }, []);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ title: "Perfil Atualizado (Simulação)", description: "Suas informações de perfil foram salvas com sucesso." });
    
    setIsSavingProfile(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e de conta (dados de exemplo)."
        icon={<User className="h-6 w-6 text-primary"/>}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center text-lg md:text-xl">Informações do Usuário</CardTitle>
          <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave}>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} data-ai-hint="user avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" disabled>Mudar Foto</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nome Completo / Razão Social</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="displayName">Nome de Exibição / Fantasia</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Endereço de Email</Label>
                <Input id="email" type="email" value={email} disabled className="cursor-not-allowed bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado.</p>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                 <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
            {mockProfile.account_type === 'pessoa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpfCnpj">CPF</Label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="rg" value={rg} onChange={(e) => setRg(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
            )}
             {mockProfile.account_type === 'empresa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpfCnpj">CNPJ</Label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingProfile} className="ml-auto">
              {isSavingProfile ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Perfil</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
