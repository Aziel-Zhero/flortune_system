// src/app/(admin)/admin/telegram/page.tsx
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

interface MessageTemplates {
  newSubscriber: string;
  paymentFailed: string;
  revenueGoalMet: string;
}

export default function TelegramPage() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [messageTemplates, setMessageTemplates] = useState<MessageTemplates>({
    newSubscriber: "🎉 Novo assinante! O usuário {userName} acabou de assinar o plano {planName}. Parabéns!",
    paymentFailed: "⚠️ Falha de pagamento para o usuário {userName} no plano {planName}. Ação necessária.",
    revenueGoalMet: "🚀 Meta de faturamento atingida! A receita mensal alcançou {revenueValue}.",
  });

  useEffect(() => {
    document.title = `Integração Telegram - ${APP_NAME}`;
    
    async function loadCredentials() {
        setIsLoading(true);
        const { data, error } = await getIntegration('telegram');
        if (error) {
            toast({ title: "Erro ao carregar credenciais", description: error, variant: "destructive" });
        } else if (data) {
            setBotToken(data.bot_token || "");
            setChatId(data.chat_id || "");
        }
        setIsLoading(false);
    }
    loadCredentials();
  }, []);

  const handleSaveCredentials = async () => {
    setIsSaving(true);
    const { error } = await updateIntegration({
        bot_token: botToken, 
        chat_id: chatId 
    });

    if (error) {
        toast({ title: "Erro ao Salvar", description: error, variant: "destructive" });
    } else {
        toast({ title: "Configuração Salva!", description: "As credenciais do bot do Telegram foram salvas com sucesso." });
    }
    setIsSaving(false);
  };

  const handleSaveMessages = () => {
    toast({
      title: "Mensagens Salvas (Simulação)",
      description: "Os modelos de mensagem foram salvos com sucesso."
    });
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMessageTemplates(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleTestSend = (template: string) => {
    const sampleMessage = template
        .replace('{userName}', 'Alex Green')
        .replace('{planName}', 'Mestre Jardineiro')
        .replace('{revenueValue}', 'R$ 10.000,00');

    toast({
        title: "Simulando Envio para o Telegram",
        description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{sampleMessage}</code></pre>
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integração com Telegram"
        icon={<Send />}
        description="Conecte seu bot do Telegram para receber notificações e interagir com o Flortune."
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start gap-4">
          <Image src="/assistent.png" alt="Hana AI Assistant" width={80} height={80} className="rounded-full border-2 border-primary/50" />
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
            <div className="space-y-4 p-4 border rounded-lg">
             {isLoading ? (
                <div className="space-y-4"><Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm text-muted-foreground">Carregando credenciais...</p></div>
             ) : (
                <>
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
                <Button onClick={handleSaveCredentials} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? "Salvando..." : "Salvar Credenciais"}
                </Button>
                </>
             )}
            </div>
          </div>
        </CardContent>
      </Card>
      
       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Mensagens Automáticas</CardTitle>
            <CardDescription>Personalize o texto que a Hana enviará para cada tipo de notificação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="msg-new-subscriber">Notificação de Novo Assinante</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Textarea 
                      id="msg-new-subscriber" 
                      name="newSubscriber"
                      value={messageTemplates.newSubscriber}
                      onChange={handleTemplateChange}
                      rows={3} 
                      className="flex-grow"
                  />
                  <Button variant="outline" onClick={() => handleTestSend(messageTemplates.newSubscriber)} className="w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4" /> Testar Envio
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Variáveis disponíveis: <code>{'{userName}'}</code>, <code>{'{planName}'}</code></p>
            </div>
            <div className="space-y-2 opacity-50">
                <Label htmlFor="msg-payment-failed">Notificação de Falha de Pagamento</Label>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Textarea 
                        id="msg-payment-failed" 
                        name="paymentFailed"
                        value={messageTemplates.paymentFailed}
                        onChange={handleTemplateChange}
                        rows={3} 
                        disabled
                        className="flex-grow"
                    />
                    <Button variant="outline" disabled className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" /> Testar Envio
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Variáveis disponíveis: <code>{'{userName}'}</code>, <code>{'{planName}'}</code>, <code>{'{invoiceValue}'}</code> (Em breve)</p>
            </div>
             <div className="space-y-2 opacity-50">
                <Label htmlFor="msg-revenue-goal">Notificação de Meta de Faturamento</Label>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Textarea 
                        id="msg-revenue-goal" 
                        name="revenueGoalMet"
                        value={messageTemplates.revenueGoalMet}
                        onChange={handleTemplateChange}
                        rows={3} 
                        disabled
                        className="flex-grow"
                    />
                    <Button variant="outline" disabled className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" /> Testar Envio
                    </Button>
                 </div>
                <p className="text-xs text-muted-foreground">Variáveis disponíveis: <code>{'{revenueValue}'}</code>, <code>{'{goalName}'}</code> (Em breve)</p>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveMessages}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Mensagens
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
