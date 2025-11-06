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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dockerPullCode = `docker pull devlikeapro/waha`;
const initWahaCode = `docker run --rm -v "$(pwd)":/app/env devlikeapro/waha init-waha /app/env`;
const runWahaCode = `docker run -it --env-file "$(pwd)/.env" -v "$(pwd)/sessions:/app/.sessions" --rm -p 3000:3000 --name waha devlikeapro/waha`;
const sendMessageCode = `fetch('http://localhost:3000/api/sendText', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Api-Key': 'SUA_API_KEY_AQUI'
  },
  body: JSON.stringify({
    chatId: "SEU_NUMERO@c.us", // Ex: 5511999999999@c.us
    text: "Olá do Flortune via WAHA!",
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
              Olá! Para integrar o Flortune com o WhatsApp, vamos usar o WAHA (WhatsApp HTTP API). Siga os passos abaixo para rodar em seu ambiente local.
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
             <p className="text-sm text-muted-foreground mt-2">Guarde a `API key` gerada. Você vai precisar dela para conectar seu aplicativo ao WAHA.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Passo 3: Rodar o WAHA</h3>
             <p className="text-sm text-muted-foreground mb-2">Use o comando abaixo para iniciar o container do WAHA. Isso é para testes locais.</p>
             <CodeBlock code={runWahaCode} language="bash" />
             <p className="text-sm text-muted-foreground mt-2">Após rodar, acesse o Dashboard em <a href="http://localhost:3000/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">http://localhost:3000/dashboard</a>.</p>
          </div>
          
           <div>
            <h3 className="font-semibold mb-2">Passo 4 e 5: Iniciar Sessão e Escanear o QR Code</h3>
            <p className="text-sm text-muted-foreground mb-2">No Dashboard do WAHA, inicie a sessão "default", escaneie o QR Code com seu celular e aguarde o status mudar para "WORKING".</p>
          </div>

           <div>
            <h3 className="font-semibold mb-2">Passo 6: Enviar uma Mensagem de Teste</h3>
            <p className="text-sm text-muted-foreground mb-2">Com a sessão ativa, use o código abaixo para enviar sua primeira mensagem via API. Lembre-se de substituir os placeholders.</p>
            <div>
                <Label>Exemplo de Envio (JavaScript `fetch`)</Label>
                <CodeBlock code={sendMessageCode} language="javascript" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Nota Importante sobre Implantação (Netlify e Serverless)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
                <Server className="h-4 w-4" />
                <AlertTitle>WAHA requer um Servidor Dedicado</AlertTitle>
                <AlertDescription>
                    O Netlify é uma plataforma para sites estáticos e funções serverless, e **não pode** rodar um container Docker de longa duração como o WAHA. O WAHA precisa estar sempre ativo para manter a conexão com o WhatsApp.
                </AlertDescription>
            </Alert>
             <div>
                <h4 className="font-semibold">Qual a solução?</h4>
                <p className="text-sm text-muted-foreground">Você precisa hospedar a instância do WAHA em um serviço separado que suporte Docker. Algumas opções populares são:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>**VPS (Servidor Virtual Privado):** DigitalOcean, Vultr, Linode, Hostinger.</li>
                    <li>**Plataformas de Container:** Google Cloud Run, AWS Fargate, Render, Railway.</li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold">Como conectar tudo?</h4>
                <p className="text-sm text-muted-foreground">
                    Depois de hospedar o WAHA em um desses serviços, ele terá uma URL pública (ex: `https://meu-waha.onrender.com`). É essa URL que você irá configurar no Flortune para que seu aplicativo (no Netlify) possa se comunicar com sua API do WhatsApp.
                </p>
            </div>
             <div className="space-y-4 p-4 border rounded-lg mt-4">
              <h4 className="font-semibold">Configuração da API no Flortune</h4>
              <div className="space-y-2">
                <Label htmlFor="api-url">URL da sua API WAHA</Label>
                <Input id="api-url" placeholder="https://sua-instancia-waha.com" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">Sua Chave de API (API Key)</Label>
                <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="api-key" type="password" placeholder="Cole sua API Key do arquivo .env" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="pl-10"/>
                </div>
              </div>
            </div>
        </CardContent>
         <CardFooter>
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configuração da API
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
