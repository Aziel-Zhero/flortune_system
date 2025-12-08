// src/app/terms/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Termos de Serviço - ${APP_NAME}`,
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-background min-h-screen">
       <header className="py-4 px-4 md:px-8 border-b">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-headline font-bold">{APP_NAME} - Documentação</span>
            </Link>
            <Button asChild variant="outline">
                <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>
        </header>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <PageHeader
          title="Termos de Serviço"
          description={`Última atualização: ${new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
          icon={<FileText className="h-6 w-6 text-primary" />}
        />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Bem-vindo(a) ao {APP_NAME}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
            <p>
              Estes Termos de Serviço ("Termos") regem seu acesso e uso da plataforma {APP_NAME} ("Serviço"),
              oferecida por Flortune Inc. ("nós", "nosso"). Ao criar uma conta ou usar nossos Serviços,
              você concorda em estar vinculado a estes Termos.
            </p>

            <section>
              <h3 className="font-semibold text-foreground">1. Descrição do Serviço</h3>
              <p>
                O {APP_NAME} é uma aplicação web de gerenciamento financeiro pessoal e de projetos,
                projetada para ajudar os usuários a organizar suas finanças, acompanhar despesas, definir orçamentos,
                alcançar metas e gerenciar projetos de desenvolvimento através de ferramentas especializadas.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">2. Contas de Usuário</h3>
              <ul>
                <li><strong>Cadastro:</strong> Para usar a maioria das funcionalidades, você deve se registrar e criar uma conta. Você concorda em fornecer informações precisas, completas e atuais durante o processo de registro.</li>
                <li><strong>Segurança da Conta:</strong> Você é responsável por proteger a senha que usa para acessar o Serviço e por quaisquer atividades ou ações sob sua senha. Recomendamos o uso de senhas "fortes" (combinando letras maiúsculas e minúsculas, números e símbolos).</li>
                <li><strong>Uso Não Autorizado:</strong> Você deve nos notificar imediatamente ao tomar conhecimento de qualquer violação de segurança ou uso não autorizado de sua conta.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">3. Planos e Pagamentos</h3>
              <ul>
                <li><strong>Plano Gratuito:</strong> Oferecemos um plano gratuito ("Cultivador Consciente") com um conjunto limitado de funcionalidades.</li>
                <li><strong>Planos Pagos:</strong> Funcionalidades adicionais estão disponíveis através de planos de assinatura pagos ("Mestre Jardineiro", "DEV", "Corporativo"). Os preços e funcionalidades de cada plano estão detalhados em nossa página de Planos.</li>
                <li><strong>Faturamento:</strong> As assinaturas são cobradas mensalmente, de forma antecipada. A falha no pagamento pode resultar na suspensão ou rebaixamento do seu plano para a versão gratuita.</li>
                <li><strong>Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento. O cancelamento entrará em vigor ao final do ciclo de faturamento atual.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">4. Uso Aceitável</h3>
              <p>Você concorda em não usar o Serviço para:</p>
              <ul>
                <li>Qualquer finalidade ilegal ou não autorizada.</li>
                <li>Tentar obter acesso não autorizado aos nossos sistemas ou redes.</li>
                <li>Inserir dados falsos ou enganosos com a intenção de fraudar.</li>
                <li>Interferir ou interromper a integridade ou o desempenho do Serviço.</li>
              </ul>
            </section>
            
            <section>
                <h3 className="font-semibold text-foreground">5. Propriedade Intelectual</h3>
                <p>O Serviço e seu conteúdo original, funcionalidades e tecnologia são e permanecerão propriedade exclusiva da Flortune Inc. e seus licenciadores. Nossos logotipos e o nome {APP_NAME} são nossas marcas registradas.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">6. Limitação de Responsabilidade</h3>
              <p>
                O {APP_NAME} é uma ferramenta de auxílio e não fornece aconselhamento financeiro, legal ou de investimento.
                As decisões tomadas com base nas informações apresentadas em nossa plataforma são de sua exclusiva responsabilidade.
                Em nenhuma circunstância seremos responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos,
                incluindo, sem limitação, perda de lucros, dados, uso, ou outras perdas intangíveis.
              </p>
            </section>
            
            <section>
                <h3 className="font-semibold text-foreground">7. Alterações nos Termos</h3>
                <p>Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, faremos o possível para fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério.</p>
            </section>
            
             <section>
                <h3 className="font-semibold text-foreground">8. Contato</h3>
                <p>Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco pelo email <a href="mailto:suporte@flortune.com" className="text-primary hover:underline">suporte@flortune.com</a>.</p>
            </section>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
