// src/app/(admin)/admin/telegram/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Send, Save, KeyRound } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import Image from 'next/image';

export default function TelegramPage() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  useEffect(() => {
    document.title = `Integração Telegram - ${APP_NAME}`;
  }, []);

  const handleSave = () => {
    toast({
      title: "Configuração Salva (Simulação)",
      description: "As credenciais do bot do Telegram foram salvas com sucesso."
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integração com Telegram"
        icon={<Send />}
        description="Conecte seu bot do Telegram para receber notificações e interagir com o Flortune."
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start gap-4">
          <Image src="/Hana.png" alt="Hana AI Assistant" width={80} height={80} className="rounded-full border-2 border-primary/50" />
          <div className="flex-1">
            <CardTitle className="font-headline flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Guia de Integração com Hana
            </CardTitle>
            <CardDescription className="mt-1">
              Olá! Eu sou a Hana (花), sua assistente de IA. Vou te guiar para conectar o Flortune ao seu bot do Telegram. Siga os passos abaixo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Passo 1: Crie seu Bot no Telegram</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
              <li>Abra o Telegram e procure por <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a> (ele tem um selo de verificação).</li>
              <li>Inicie uma conversa com ele e digite ou clique em <code>/newbot</code>.</li>
              <li>Siga as instruções para dar um nome e um nome de usuário ao seu bot. O nome de usuário deve terminar com "bot" (ex: <strong>FlortuneMeuBot</strong>).</li>
              <li>O BotFather enviará uma mensagem com o seu **token de API**. Copie este token.</li>
            </ol>
          </div>

           <div>
            <h3 className="font-semibold mb-2">Passo 2: Obtenha seu Chat ID</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
              <li>Procure por <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary underline">@userinfobot</a> no Telegram.</li>
              <li>Inicie uma conversa com ele. Ele enviará imediatamente seu **ID do Chat**. Copie este número.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Passo 3: Configure as Credenciais</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">Token de API do Bot</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="botToken" type="password" placeholder="Cole seu token aqui" value={botToken} onChange={(e) => setBotToken(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chatId">Seu ID do Chat</Label>
                <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="chatId" placeholder="Cole seu Chat ID aqui" value={chatId} onChange={(e) => setChatId(e.target.value)} className="pl-10"/>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar e Ativar Integração
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
