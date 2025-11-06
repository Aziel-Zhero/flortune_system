// src/app/(admin)/admin/whatsapp-official/page.tsx
"use client";

import { useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import Image from 'next/image';

export default function WhatsappOfficialPage() {
  useEffect(() => {
    document.title = `Integração WhatsApp (Oficial) - ${APP_NAME}`;
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integração com WhatsApp (API Oficial)"
        icon={<CheckCircle />}
        description="Gerencie a futura integração com a API oficial do WhatsApp."
      />

       <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start gap-4">
          <Image src="/Hana.png" alt="Hana AI Assistant" width={80} height={80} className="rounded-full border-2 border-primary/50" />
          <div className="flex-1">
            <CardTitle className="font-headline flex items-center gap-2">
              <Construction className="h-6 w-6 text-amber-500" />
              Página em Construção
            </CardTitle>
            <CardDescription className="mt-1">
              Olá! A integração direta com a API Oficial do WhatsApp está em nosso roadmap. Em breve, esta página permitirá que você conecte sua conta do WhatsApp Business para notificações avançadas, automação e muito mais. Fique de olho nas atualizações!
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-sm">
                Enquanto isso, você pode utilizar a integração com o <a href="/admin/whatsapp" className="text-primary underline">WAHA (WhatsApp HTTP API)</a> para automações via self-hosting.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
