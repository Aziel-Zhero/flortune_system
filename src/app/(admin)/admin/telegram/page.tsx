
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Save, KeyRound, Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import Image from 'next/image';
import { getIntegration, updateIntegration } from '@/services/integration.service';

export default function TelegramPage() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = `Integração Telegram - ${APP_NAME}`;
    loadCredentials();
  }, []);

  async function loadCredentials() {
    setIsLoading(true);
    const { data, error } = await getIntegration('telegram');
    if (data) {
        setBotToken(data.bot_token || "");
        setChatId(data.chat_id || "");
        setGreetingMessage(data.greeting_message || "");
        setHistoryMessage(data.history_message || "");
        setTestMessage(data.test_message || "");
        setUpdatedAt(data.updated_at || null);
    }
    setIsLoading(false);
  }

  const handleSaveCredentials = async () => {
    if (!botToken || !chatId) {
        toast({ title: "Campos obrigatórios", description: "Preencha o Token e o Chat ID.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    const { error } = await updateIntegration({
        bot_token: botToken, 
        chat_id: chatId,
        greeting_message: greetingMessage,
        history_message: historyMessage,
        test_message: testMessage,
    });

    if (error) {
        toast({ title: "Erro ao Salvar", description: error, variant: "destructive" });
    } else {
        toast({ title: "Configuração Salva!", description: "As frases e credenciais do Telegram foram salvas com sucesso." });
        loadCredentials();
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 max-w-[1850px] mx-auto w-full">
      <PageHeader
        title="Integração com Telegram"
        icon={<Send />}
        description="Conecte seu bot do Telegram para receber notificações reais do Flortune."
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start gap-4">
          <Image src="/assistent.png" alt="Hana AI Assistant" width={80} height={80} className="rounded-full border-2 border-primary/50" />
          <div className="flex-1">
            <CardTitle className="font-headline flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Configuração do Bot Hana
            </CardTitle>
            <CardDescription className="mt-1">
              Olá! Insira suas credenciais abaixo para que eu possa enviar alertas de novos assinantes e metas batidas diretamente para você.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-background/50">
             {isLoading ? (
                <div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Carregando credenciais do banco...</p></div>
             ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="botToken">Token de API do Bot (via @BotFather)</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="botToken" type="password" placeholder="Ex: 123456789:ABCDEF..." value={botToken} onChange={(e) => setBotToken(e.target.value)} className="pl-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chatId">Seu ID do Chat (via @userinfobot)</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="chatId" placeholder="Ex: 987654321" value={chatId} onChange={(e) => setChatId(e.target.value)} className="pl-10"/>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="greetingMessage">Frase de Saudação</Label>
                            <Textarea id="greetingMessage" value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} placeholder="Olá! Aqui está o seu resumo diário..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="historyMessage">Histórico e Mensagem de Relatório</Label>
                            <Textarea id="historyMessage" value={historyMessage} onChange={(e) => setHistoryMessage(e.target.value)} placeholder="Últimos resultados: ..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="testMessage">Mensagem de Teste</Label>
                            <Textarea id="testMessage" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Teste: este é um alerta do bot." />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-muted-foreground">
                            {updatedAt ? `Última atualização: ${new Date(updatedAt).toLocaleString('pt-BR')}` : 'Nenhuma configuração salva ainda.'}
                        </div>
                        <Button onClick={handleSaveCredentials} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Credenciais e Frases
                        </Button>
                    </div>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
