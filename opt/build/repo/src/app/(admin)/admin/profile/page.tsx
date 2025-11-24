// src/app/(admin)/admin/profile/page.tsx
"use client";

import { useState, useEffect, type FormEvent, useRef, type ChangeEvent } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';

// Mock data for admin profile
const mockAdminProfile = {
  fullName: "Administrador do Sistema",
  displayName: "Admin",
  email: "admin@flortune.com",
  avatarUrl: `https://placehold.co/100x100/fca5a5/1e293b?text=A`,
  avatarFallback: "A",
};


export default function AdminProfilePage() {
  const [fullName, setFullName] = useState(mockAdminProfile.fullName);
  const [displayName, setDisplayName] = useState(mockAdminProfile.displayName);
  const [email, setEmail] = useState(mockAdminProfile.email);
  const [avatarUrl, setAvatarUrl] = useState(mockAdminProfile.avatarUrl);
  const [avatarFallback, setAvatarFallback] = useState(mockAdminProfile.avatarFallback);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    document.title = `Perfil de Admin - ${APP_NAME}`;
  }, []);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would upload the new avatar if it changed
    // and then save the new profile data.
    mockAdminProfile.fullName = fullName;
    mockAdminProfile.displayName = displayName;
    mockAdminProfile.avatarUrl = avatarUrl;
    
    toast({ title: "Perfil de Admin Atualizado (Simulação)", description: "Suas informações de perfil foram salvas com sucesso." });
    
    setIsSavingProfile(false);
  };
  
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
                setAvatarUrl(result);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Perfil de Administrador"
        description="Gerencie as informações da sua conta de administrador."
        icon={<User className="h-6 w-6 text-primary"/>}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center text-lg md:text-xl">Suas Informações</CardTitle>
          <CardDescription>Atualize suas informações de contato e exibição.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave}>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} data-ai-hint="admin avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Mudar Foto</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Endereço de Email</Label>
                <Input id="email" type="email" value={email} disabled className="cursor-not-allowed bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado.</p>
              </div>
            </div>
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
