
// src/app/(app)/profile/page.tsx
"use client";

import { useState, useEffect, type FormEvent, useRef, type ChangeEvent } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Smartphone, FileText, Fingerprint, Save, CheckSquare, Upload, Beaker, ShieldAlert } from "lucide-react";
import { useSession } from "@/contexts/auth-context";
import { toast } from '@/hooks/use-toast';
import { APP_NAME, PRICING_TIERS } from '@/lib/constants';
import type { Profile } from '@/types/database.types';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { session, isLoading, update: updateSession } = useSession();

  const userFromSession = session?.user;
  const profileFromSession = session?.user?.profile;

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [rg, setRg] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarFallback, setAvatarFallback] = useState("U");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `Meu Perfil - ${APP_NAME}`;
  }, []);

  useEffect(() => {
    if (profileFromSession) {
      setFullName(profileFromSession.full_name || "");
      setDisplayName(profileFromSession.display_name || "");
      setPhone(profileFromSession.phone || "");
      setCpfCnpj(profileFromSession.cpf_cnpj || "");
      setRg(profileFromSession.rg || "");
      
      const currentAvatar = profileFromSession.avatar_url || userFromSession?.user_metadata?.avatar_url || "";
      setAvatarUrl(currentAvatar);
      setAvatarFallback((profileFromSession.display_name || userFromSession?.email || "U").charAt(0).toUpperCase());
    }
    if (userFromSession?.email) {
      setEmail(userFromSession.email);
    }
  }, [profileFromSession, userFromSession]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
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

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!userFromSession?.id || !supabase) {
      toast({ title: "Erro", description: "Usuário não autenticado ou serviço indisponível.", variant: "destructive" });
      return;
    }
    setIsSavingProfile(true);

    try {
      let publicAvatarUrl = profileFromSession?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userFromSession.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error("Erro ao enviar imagem.");
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        publicAvatarUrl = data.publicUrl;
      }
      
      const updatedProfileData: Partial<Profile> = {
        full_name: fullName,
        display_name: displayName,
        phone,
        cpf_cnpj: cpfCnpj,
        rg,
        avatar_url: publicAvatarUrl,
        updated_at: new Date().toISOString(),
      };
      
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', userFromSession.id)
        .select()
        .single();

      if (error) throw error;

      if (updatedProfile) {
        if (session && session.user) {
            await updateSession({
                ...session,
                user: { ...session.user, profile: updatedProfile as Profile },
            });
        }
      
        toast({
          title: "Perfil Atualizado",
          description: "Suas informações foram salvas com sucesso.",
          action: <CheckSquare className="text-green-500"/>
        });
      
        setAvatarFile(null);
      }
      
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Erro ao Salvar", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSwitchPlan = async (planId: string) => {
    if (!userFromSession?.id || !supabase) return;
    const { data, error } = await supabase
        .from('profiles')
        .update({ plan_id: planId })
        .eq('id', userFromSession.id)
        .select()
        .single();
    
    if (!error && data) {
        await updateSession({ ...session, user: { ...session?.user, profile: data as Profile } as any });
        toast({ title: "Plano Alterado", description: `Plano atualizado para ${planId}.` });
    }
  };

  const handleSwitchRole = async (role: 'user' | 'admin') => {
    if (!userFromSession?.id || !supabase) return;
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userFromSession.id)
        .select()
        .single();
    
    if (!error && data) {
        await updateSession({ ...session, user: { ...session?.user, profile: data as Profile } as any });
        toast({ title: "Permissão Alterada", description: `Role atualizada para ${role}.` });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais e de conta." icon={<User className="h-6 w-6 text-primary"/>}/>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e de conta."
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
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4"/>
                Mudar Foto
              </Button>
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
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                 <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                </div>
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

      {/* SEÇÃO DE TESTE - PARA VALIDAÇÃO DE PLANOS */}
      <Card className="shadow-sm border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="font-headline flex items-center text-lg text-amber-700">
            <Beaker className="mr-2 h-5 w-5"/> Modo Teste: Validação de Planos
          </CardTitle>
          <CardDescription>Use estes botões para alternar seu plano e validar as restrições de navegação do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-3">
                <Label className="text-amber-800 font-bold">Mudar Tipo de Usuário (Plano):</Label>
                <div className="flex flex-wrap gap-2">
                    {PRICING_TIERS.map(tier => (
                        <Button 
                            key={tier.id} 
                            variant={profileFromSession?.plan_id === tier.id ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleSwitchPlan(tier.id)}
                            className={cn(profileFromSession?.plan_id === tier.id && "bg-amber-600")}
                        >
                            {tier.name}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-amber-500/20">
                <Label className="text-amber-800 font-bold">Mudar Papel (Role):</Label>
                <div className="flex gap-2">
                    <Button 
                        variant={profileFromSession?.role === 'user' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => handleSwitchRole('user')}
                        className={cn(profileFromSession?.role === 'user' && "bg-amber-600 text-white")}
                    >
                        <User className="mr-2 h-4 w-4"/> Usuário Padrão
                    </Button>
                    <Button 
                        variant={profileFromSession?.role === 'admin' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => handleSwitchRole('admin')}
                        className={cn(profileFromSession?.role === 'admin' && "bg-amber-600 text-white")}
                    >
                        <ShieldAlert className="mr-2 h-4 w-4"/> Administrador
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
