// src/app/(admin)/admin/whatsapp/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Save, KeyRound, Server, Download, ClipboardCopy, FileCode } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import Image from 'next/image';
import { CodeBlock } from '@/components/shared/code-block';

const dockerPullCode = `docker pull devlikeapro/waha`;
const initWahaCode = `docker run --rm -v "$(pwd)":/app/env devlikeapro/waha init-waha /app/env`;
const runWahaCode = `docker run -it --env-file "$(pwd)/.env" -v "$(pwd)/sessions:/app/.sessions" --rm -p 3000:3000 --name waha devlikeapro/waha`;
const sendMessageCode = `fetch('http://localhost:3000/api/sendText', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Api-Key': '00000000000000000000000000000000' // Substitua pela sua API Key
  },
  body: JSON.stringify({
    chatId: "123123@c.us", // Substitua pelo seu número
    text: "Hi there!",
    session: "default"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

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
        title="Integração com WhatsApp (WAHA A Plus)"
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
        <CardContent className="space-y-8">
          <div>
            <h3 className="font-semibold mb-2">Passo 0: Requisitos</h3>
            <p className="text-sm text-muted-foreground mb-2">
              O WAHA funciona com Docker. Certifique-se de que você o tem instalado. Siga o guia oficial do <a href="https://docs.docker.com/get-docker/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Docker para instalá-lo</a>.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Passo 1: Baixar a Imagem do Docker</h3>
             <CodeBlock code={dockerPullCode} language="bash" />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Passo 2: Iniciar o WAHA e Gerar Credenciais</h3>
            <p className="text-sm text-muted-foreground mb-2">Este comando criará um arquivo `.env` no seu diretório atual com as credenciais.</p>
             <CodeBlock code={initWahaCode} language="bash" />
             <p className="text-sm text-muted-foreground mt-2">Guarde o `Username`, `Password` e `API key` gerados.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Passo 3: Rodar o WAHA</h3>
             <p className="text-sm text-muted-foreground mb-2">Use o comando abaixo para iniciar o container do WAHA com as credenciais geradas. Lembre-se que esta não é uma instalação para produção.</p>
             <CodeBlock code={runWahaCode} language="bash" />
             <p className="text-sm text-muted-foreground mt-2">Após rodar, acesse o Dashboard em <a href="http://localhost:3000/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">http://localhost:3000/dashboard</a>.</p>
          </div>
          
           <div>
            <h3 className="font-semibold mb-2">Passo 4, 5 e 6: Iniciar Sessão e Enviar Mensagem</h3>
            <p className="text-sm text-muted-foreground mb-2">No Dashboard, inicie a sessão "default", escaneie o QR Code com seu celular e, quando o status for "WORKING", use o código abaixo para enviar sua primeira mensagem.</p>
            <div>
                <Label>Exemplo de Envio (JavaScript `fetch`)</Label>
                <CodeBlock code={sendMessageCode} language="javascript" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
