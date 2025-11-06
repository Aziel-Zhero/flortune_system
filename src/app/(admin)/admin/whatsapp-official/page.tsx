// src/app/(admin)/admin/whatsapp-official/page.tsx
"use client";

import { useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Zap, XCircle, Bot } from "lucide-react";
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function WhatsappOfficialPage() {
  useEffect(() => {
    document.title = `Integração WhatsApp (Oficial) - Flortune`;
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integração com WhatsApp (API Oficial)"
        icon={<MessageSquare />}
        description="Entenda como usar a API oficial do WhatsApp através de um provedor."
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
              Olá! Usar a API Oficial do WhatsApp é a forma mais robusta e segura de integrar o WhatsApp. Diferente do WAHA, você não precisa de um servidor próprio, pois usaremos um **Provedor de Soluções de Negócios (BSP)**.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <h3 className="font-semibold text-lg mb-2">O que é um Provedor de Soluções de Negócios (BSP)?</h3>
                <p className="text-sm text-muted-foreground">São empresas parceiras da Meta que gerenciam a infraestrutura da API do WhatsApp para você. Você simplesmente consome a API deles, que é muito mais simples, e eles cuidam de toda a complexidade por trás.</p>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-emerald-500"/>Vantagens</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                        <li><strong className="text-foreground">Oficial e Estável:</strong> Aprovado pela Meta, sem riscos de bloqueio.</li>
                        <li><strong className="text-foreground">Escalável:</strong> Preparado para alto volume de mensagens.</li>
                        <li><strong className="text-foreground">Sem Servidor Próprio:</strong> Não precisa se preocupar com Docker ou VPS.</li>
                        <li><strong className="text-foreground">Suporte Dedicado:</strong> Os provedores oferecem suporte técnico.</li>
                    </ul>
                </div>
                 <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive"/>Desvantagens</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                        <li><strong className="text-foreground">Custo:</strong> Geralmente há um custo por conversa ou uma mensalidade.</li>
                        <li><strong className="text-foreground">Setup Inicial:</strong> Exige um processo de verificação da sua empresa (Facebook Business Manager).</li>
                        <li><strong className="text-foreground">Modelos de Mensagem:</strong> Para iniciar conversas, você precisa ter modelos de mensagem pré-aprovados pela Meta.</li>
                    </ul>
                </div>
            </div>
             <div>
                <h3 className="font-semibold text-lg mb-2">Provedores Populares</h3>
                <p className="text-sm text-muted-foreground mb-4">Abaixo estão alguns dos provedores mais conhecidos que oferecem acesso à API Oficial do WhatsApp. Cada um tem seus próprios preços e funcionalidades.</p>
                <div className="flex flex-wrap gap-4">
                    <Button asChild variant="outline"><a href="https://www.twilio.com/whatsapp" target="_blank" rel="noopener noreferrer">Twilio</a></Button>
                    <Button asChild variant="outline"><a href="https://www.messagebird.com/pt-br/whatsapp" target="_blank" rel="noopener noreferrer">MessageBird</a></Button>
                    <Button asChild variant="outline"><a href="https://www.vonage.com/communications-apis/whatsapp/" target="_blank" rel="noopener noreferrer">Vonage</a></Button>
                    <Button asChild variant="outline"><a href="https://www.zenvia.com/produtos/api-whatsapp-business/" target="_blank" rel="noopener noreferrer">Zenvia</a></Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
