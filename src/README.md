
# Flortune 🌿💰

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Genkit](https://img.shields.io/badge/Genkit-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Netlify Status](https://api.netlify.com/api/v1/badges/7a83ef7b-a0c1-422e-9b08-0a958476c3d1/deploy-status)](https://app.netlify.com/projects/flortunez/deploys)

**Flortune** é um aplicativo web moderno para gerenciamento financeiro pessoal, projetado para ajudar os usuários a cultivar suas finanças, acompanhar despesas e receitas, definir orçamentos, alcançar metas financeiras e obter insights inteligentes.

![Flortune Mockup](https://placehold.co/800x450.png?text=Flortune+App+Interface)
*Interface do Flortune (imagem ilustrativa)*

## ✨ Funcionalidades Principais

*   👤 **Autenticação de Usuários (com NextAuth.js e Supabase Adapter):**
    *   Cadastro e Login com Email/Senha (Pessoa Física e Jurídica com campos condicionais e máscaras), usando a tabela `public.profiles` para detalhes e senhas hasheadas, e o schema `next_auth` para gerenciamento de sessão pelo adapter.
    *   Login/Cadastro com Google (OAuth).
    *   Gerenciamento de perfil de usuário (nome, avatar, CPF/CNPJ, RG) na tabela `public.profiles`.
*   💸 **Gerenciamento Financeiro (Supabase):**
    *   Transações (CRUD completo, incluindo marcação de transações recorrentes).
    *   Categorias (Leitura de categorias padrão e do usuário, adição de novas).
    *   Orçamentos (CRUD completo, acompanhamento de gastos).
    *   Metas Financeiras (CRUD completo, acompanhamento de progresso).
    *   Lista de Tarefas (CRUD completo).
*   📊 **Análise e Visualização:**
    *   Dashboard principal com resumos e destaques.
    *   Página de Análise com gráficos de gastos, receitas e fluxo de caixa (reais e exemplos).
    *   Calendário financeiro para visualização de eventos e transações.
*   🛠️ **Ferramentas (Menu "Sistemas" para DEV):**
    *   Calculadora de Precificação de Projetos (Freelancer).
    *   Calculadora de Precificação por ROI (Automação).
    *   Calculadora de Precificação de Pacotes/Assinaturas.
    *   Conversor de Moeda (com API externa).
    *   Conversor de Tempo (em desenvolvimento).
    *   Calculadora de Juros Simples/Compostos (em desenvolvimento).
    *   Calculadora de Uptime SLA (em desenvolvimento).
*   🎨 **Interface do Usuário:**
    *   Modo Privado para ocultar valores sensíveis.
    *   Múltiplos temas de cores e Modo Escuro.
    *   Design responsivo e moderno com ShadCN UI e Tailwind CSS.
    *   Menu lateral colapsável.
*   📝 **Anotações:**
    *   Espaço para anotações e ideias (em desenvolvimento).
*   🤖 **Funcionalidades de IA (com Genkit - em desenvolvimento):**
    *   Sugestões financeiras inteligentes.
    *   Auto-categorização de transações.
*   🤝 **Compartilhamento (Futuro):**
    *   Compartilhamento de módulos financeiros com outros usuários (visualizar/editar).

## 🛠️ Stack Tecnológica

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **UI:** [React](https://reactjs.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/)
*   **Autenticação:** [NextAuth.js (Auth.js)](https://next-auth.js.org/) com [@auth/supabase-adapter](https://www.npmjs.com/package/@auth/supabase-adapter)
*   **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **AI:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **Deployment:** [Netlify](https://www.netlify.com/)

## 🚀 Começando (Getting Started)

### Pré-requisitos
*   Node.js (versão LTS)
*   npm ou yarn
*   Conta [Supabase](https://supabase.com/)
*   Conta [Google Cloud Console](https://console.cloud.google.com/) (para configurar OAuth do Google)
*   Conta [Netlify](https://www.netlify.com/) (opcional para dev local, necessário para deploy)

### 1. Clonar e Instalar
```bash
git clone <url-do-seu-repositorio>
cd flortune
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` (ou `.env.local`) na raiz do projeto. Substitua os placeholders:
```env
# Supabase (usado pelo cliente Supabase e pelo adapter)
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SUPABASE_SERVICE_ROLE_KEY # Chave de Admin, encontrada em Project Settings > API
SUPABASE_JWT_SECRET=SEU_SUPABASE_JWT_SECRET # Encontrado em Project Settings > API > JWT Settings

# NextAuth.js (Auth.js)
AUTH_SECRET=GERAR_UM_SEGREDO_FORTE_E_LONGO # Use `openssl rand -base64 32` no terminal
# A variável NEXTAUTH_URL é configurada automaticamente pelo Netlify/Vercel em produção.
# Para desenvolvimento local, o Next.js a define como http://localhost:9003 por padrão.

# Google Provider (OAuth)
GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID_DO_GOOGLE_CLOUD_CONSOLE
GOOGLE_CLIENT_SECRET=SEU_GOOGLE_CLIENT_SECRET_DO_GOOGLE_CLOUD_CONSOLE

# Chaves de API para serviços externos (Opcional)
OPENWEATHERMAP_API_KEY=SUA_CHAVE_API_DO_OPENWEATHERMAP
EXCHANGERATE_API_KEY=SUA_CHAVE_API_DO_EXCHANGERATE

# Opcional: Para Genkit (se usar IA do Google)
# GOOGLE_API_KEY=<SUA_GOOGLE_AI_STUDIO_KEY>
```
*   `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_JWT_SECRET`: Cruciais para o SupabaseAdapter e para a geração de tokens JWT para o Supabase. **Trate-os como senhas.**
*   `AUTH_SECRET`: Um segredo forte e aleatório é essencial para a segurança do NextAuth.js.

### 3. Configurar o Banco de Dados Supabase
Execute o script SQL de `docs/database_schema.sql` no Editor SQL do seu painel Supabase.
1.  Acesse seu projeto no Supabase.
2.  Vá para **SQL Editor** > **+ New query**.
3.  Copie e cole o conteúdo completo de `docs/database_schema.sql`.
4.  Clique em **RUN**.
    Isso criará o schema `next_auth` (para o adapter), a tabela `public.profiles` (para detalhes do usuário) e as outras tabelas da aplicação, junto com os triggers e políticas de segurança necessários.

### 4. Configurar Google OAuth 2.0 (Para Login com Google)
1.  Vá para o [Google Cloud Console](https://console.cloud.google.com/).
2.  Crie ou selecione um projeto.
3.  Configure uma "Tela de consentimento OAuth".
4.  Crie credenciais do tipo "ID do cliente OAuth 2.0".
    *   Selecione "Aplicativo da Web".
    *   Em "URIs de redirecionamento autorizadas", adicione:
        *   Para desenvolvimento: `http://localhost:9003/api/auth/callback/google`
        *   Para produção (ex: Netlify): `https://SEU-DOMINIO.netlify.app/api/auth/callback/google` (substitua `SEU-DOMINIO` pelo nome do seu site no Netlify)
5.  Copie o "ID do cliente" e o "Segredo do cliente" para as variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no seu arquivo `.env` (e nas configurações do Netlify).

### 5. Executar o Aplicativo Localmente
```bash
npm run dev
```
O servidor Next.js iniciará em `http://localhost:9003`.

### 6. Build para Produção
```bash
npm run build
```

### 7. Deploy com Netlify
1.  Conecte seu repositório ao Netlify.
2.  **🔥 CRÍTICO: Configure as Variáveis de Ambiente no Netlify:** Vá para `Site configuration` > `Build & deploy` > `Environment` > `Environment variables`. Adicione **todas** as variáveis de ambiente do seu arquivo `.env` local. O arquivo `.env` **não** é enviado para o servidor de produção, então esta etapa é obrigatória para que o site funcione.
3.  O Netlify usará o `netlify.toml` e o plugin `@netlify/plugin-nextjs` para construir e implantar seu site. A variável `NEXTAUTH_URL` será configurada automaticamente por ele.

## 📂 Estrutura do Projeto
*   `src/app/`: Rotas e páginas (Next.js App Router).
    *   `(app)/`: Rotas protegidas que requerem autenticação.
        *   `dev/`: Rotas para ferramentas de desenvolvimento.
            * `systems/`: Hub para ferramentas e calculadoras.
    *   `login/`, `signup/`: Páginas públicas de autenticação.
    *   `api/auth/[...nextauth]/route.ts`: Configuração central do NextAuth.js.
*   `src/components/`: Componentes React.
    *   `auth/`: Componentes para login, cadastro, layout de autenticação.
    *   `layout/`: Componentes de layout da aplicação (header, sidebar).
    *   `shared/`: Componentes reutilizáveis em várias partes do app.
    *   `ui/`: Componentes ShadCN UI.
*   `src/lib/`: Utilitários, constantes, cliente Supabase.
*   `src/services/`: Funções para interagir com o Supabase (CRUD para transações, categorias, etc.).
*   `src/ai/`: Configuração e fluxos Genkit para funcionalidades de IA.
*   `src/contexts/`: Provedores de contexto React (ex: `AppSettingsProvider`).
*   `src/hooks/`: Hooks React customizados.
*   `src/types/`: Definições TypeScript (ex: `database.types.ts`, `next-auth.d.ts`).
*   `docs/`: Documentação, incluindo `database_schema.sql`.

## 🐛 Solução de Problemas Comuns (Troubleshooting)

Durante a configuração e desenvolvimento, você pode encontrar alguns problemas comuns. Aqui estão as soluções para os mais frequentes:

### 1. Erro "Failed to fetch" ou Erros de API em Produção (Netlify/Vercel)

*   **Causa:** Este é o erro mais comum. Ocorre porque as variáveis de ambiente (como `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) definidas no seu arquivo `.env` local **não** são enviadas automaticamente para o ambiente de produção.
*   **Solução:**
    1.  Vá para o painel do seu site no Netlify (ou Vercel, etc.).
    2.  Navegue até a seção de configuração do site, geralmente em `Site configuration` > `Build & deploy` > `Environment`.
    3.  Clique em `Environment variables` e adicione, uma por uma, **todas as chaves e valores** do seu arquivo `.env`.
    4.  Após adicionar todas as variáveis, acione um novo deploy para que as alterações entrem em vigor.

### 2. Login com Google Falha com `Erro 400: redirect_uri_mismatch`

*   **Causa:** Este erro indica que a "URI de redirecionamento autorizada" configurada no Google Cloud Console para o seu Client ID OAuth não corresponde exatamente à URI que o NextAuth.js (e seu app) está usando.
*   **Solução:**
    1.  **Google Cloud Console:**
        *   Acesse o [Google Cloud Console](https://console.cloud.google.com/) > APIs e Serviços > Credenciais.
        *   Selecione seu ID do Cliente OAuth 2.0.
        *   Na seção "URIs de redirecionamento autorizadas", adicione **exatamente**:
            *   Para desenvolvimento local: `http://localhost:9003/api/auth/callback/google`
            *   Para produção (ex: Netlify): `https://SEU-DOMINIO.netlify.app/api/auth/callback/google` (substitua `SEU-DOMINIO.netlify.app` pelo seu URL real).
        *   Garanta que o protocolo (`http` vs `https`) e o caminho estejam corretos, sem barras extras no final. Salve as alterações.
    2.  **Variável de Ambiente `NEXTAUTH_URL`:**
        *   Em ambientes de produção como Netlify e Vercel, esta variável geralmente é configurada automaticamente. Se o erro persistir, você pode configurá-la manualmente nas variáveis de ambiente do seu provedor de hospedagem para garantir que ela aponte para a URL base do seu site (ex: `https://SEU-DOMINIO.netlify.app`).

### 3. Cadastro Manual Falha com Erro de Banco de Dados

*   **Causa:** Conflitos na criação de usuários entre a lógica da aplicação e os `triggers` do banco de dados, ou restrições de chave estrangeira incorretas.
*   **Solução:**
    *   O fluxo de autenticação foi refatorado. A `Server Action` de cadastro (`signupUser`) agora cria o usuário diretamente no `Supabase Auth`.
    *   Um `trigger` no banco de dados (`handle_new_user`) é acionado para criar um registro correspondente na tabela `public.profiles`, garantindo a sincronização.
    *   As restrições de chave estrangeira conflitantes foram removidas do script `docs/database_schema.sql`.
    *   **Se você encontrar erros, a primeira etapa é sempre re-executar o script `docs/database_schema.sql` completo no seu SQL Editor do Supabase para garantir que a estrutura mais recente e correta esteja em vigor.**

### 4. Build no Netlify Falha

*   **Causas Comuns:** Variáveis de ambiente ausentes no Netlify, erros de runtime (Edge vs. Node.js), ou `useSearchParams()` sem um `<Suspense>`.
*   **Soluções:**
    1.  **Variáveis de Ambiente:** Configure **TODAS** as variáveis do seu `.env` local nas "Environment variables" do seu site no Netlify.
    2.  **Runtime:** Adicione `export const runtime = 'nodejs';` no início do arquivo `src/app/api/auth/[...nextauth]/route.ts` para forçar a execução desta rota no runtime Node.js.
    3.  **Suspense:** Em páginas como login e cadastro, envolva os componentes de formulário (que usam `useSearchParams`) com `<Suspense fallback={...}>`.

## 🗺️ Roadmap
*   [ ] Implementação completa de gestão de Assinaturas (Stripe).
*   [ ] Testes unitários e de integração.
*   [ ] Funcionalidade de compartilhamento de módulos.
*   [ ] Implementação de edição para Transações, Orçamentos e Categorias.
*   [ ] Implementação de exclusão para Categorias.

## 🤝 Contribuir
Contribuições são bem-vindas! Fork, branch, commit, push, PR.

## 📜 Licença
MIT.
---
Cultive suas finanças com Flortune! 🌿💰
