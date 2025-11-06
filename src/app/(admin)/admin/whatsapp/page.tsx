// src/app/(admin)/admin/whatsapp/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Save, KeyRound, Server } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import Image from 'next/image';
import { CodeBlock } from '@/components/shared/code-block';

const installDependenciesCode = `npm install axios express`;

const sendMessageCode = `const axios = require('axios');

const url = "http://localhost:3000/api/sendText";
const data = {
    session: "default",
    chatId: "12132132130@c.us",
    text: "Hi there!"
};

axios.post(url, data)
    .then(response => console.log(response.data))
    .catch(error => console.error(error));`;

const receiveMessageCode = `const express = require('express');
const app = express();
app.use(express.json());

app.post("/bot", (req, res) => {
    const data = req.body;
    // It is not a message
    if (data.event !== "message") {
        res.send("OK");
        return;
    }
    // Process the message, save it, etc.
    processMessage(data.payload);
    res.send("OK");
});

app.listen(3000, () => console.log("Bot is running on port 3000"));`;

export default function WahaWhatsappPage() {
  const [apiUrl, setApiUrl] = useState("http://localhost:3000");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    document.title = `Integração WhatsApp (WAHA) - ${APP_NAME}`;
  }, []);

  const handleSaveChanges = () => {
    toast({
      title: "Configuração Salva (Simulação)",
      description: "As credenciais da API do WhatsApp foram salvas."
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integração com WhatsApp (WAHA)"
        icon={<Bot />}
        description="Conecte uma instância do WhatsApp HTTP API (WAHA) para automações."
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
              Olá! Para integrar o Flortune com o WhatsApp, vamos usar o WAHA (WhatsApp HTTP API). Siga os passos abaixo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Passo 1: Instale o WAHA</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Primeiro, você precisa ter uma instância do WAHA rodando. Você pode instalá-lo localmente usando Docker. Consulte a <a href="https://github.com/devlikeapro/waha" target="_blank" rel="noopener noreferrer" className="text-primary underline">documentação oficial do WAHA</a> para detalhes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Passo 2: Configure as Credenciais</h3>
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="api-url">URL da Instância WAHA</Label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="api-url" placeholder="http://localhost:3000" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">Chave da API (se configurada)</Label>
                <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="api-key" type="password" placeholder="Chave de API opcional" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="pl-10"/>
                </div>
              </div>
            </div>
          </div>
          
           <div>
            <h3 className="font-semibold mb-2">Passo 3: Exemplos de Código (JS/TS)</h3>
            <div className="space-y-4">
                <div>
                    <Label>Instalar Dependências</Label>
                    <CodeBlock code={installDependenciesCode} language="bash" />
                </div>
                <div>
                    <Label>Enviar Mensagem</Label>
                    <CodeBlock code={sendMessageCode} language="javascript" />
                </div>
                 <div>
                    <Label>Receber Mensagem (Webhook)</Label>
                    <CodeBlock code={receiveMessageCode} language="javascript" />
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
