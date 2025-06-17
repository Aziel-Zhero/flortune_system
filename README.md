
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
    *   Gerenciamento de perfil de usuário (nome, avatar, CPF/CNPJ, RG) na tabela `public.profiles`.
*   💸 **Gerenciamento Financeiro (Supabase):**
    *   Transações (CRUD completo).
    *   Categorias (Leitura de categorias padrão e do usuário, adição de novas).
    *   Orçamentos (CRUD completo, acompanhamento de gastos).
    *   Metas Financeiras (CRUD completo, acompanhamento de progresso).
*   📊 **Análise e Visualização:**
    *   Dashboard principal com resumos e destaques.
    *   Página de Análise com gráficos de gastos, receitas e fluxo de caixa.
    *   Calendário financeiro para visualização de eventos e transações.
*   🎨 **Interface do Usuário:**
    *   Modo Privado para ocultar valores sensíveis.
    *   Modo Escuro.
    *   Design responsivo e moderno com ShadCN UI e Tailwind CSS.
*   🤖 **Funcionalidades de IA (com Genkit - em desenvolvimento):**
    *   Sugestões financeiras inteligentes.
    *   Auto-categorização de transações.
*   🤝 **Compartilhamento (Futuro):**
    *   Compartilhamento de módulos financeiros com outros usuários (visualizar/editar).

## 🛠️ Stack Tecnológica

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **UI:** [React](https://reactjs.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
*   **Autenticação:** [NextAuth.js (Auth.js)](https://next-auth.js.org/) com [@auth/supabase-adapter](https://www.npmjs.com/package/@auth/supabase-adapter)
*   **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **AI:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **Deployment:** [Netlify](https://www.netlify.com/)

## 🚀 Começando (Getting Started)

### Pré-requisitos
*   Node.js (versão LTS)
*   npm ou yarn
*   Conta [Supabase](https://supabase.com/)
*   Conta [Netlify](https://www.netlify.com/) (opcional para dev local)

### 1. Clonar e Instalar
```bash
git clone <url-do-seu-repositorio>
cd flortune
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto. Substitua os placeholders:
```env
# Supabase (usado pelo cliente Supabase e pelo adapter)
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SUPABASE_SERVICE_ROLE_KEY # Chave de Admin, encontrada em Project Settings > API
SUPABASE_JWT_SECRET=SEU_SUPABASE_JWT_SECRET # Encontrado em Project Settings > API > JWT Settings

# NextAuth.js (Auth.js)
AUTH_SECRET=GERAR_UM_SEGREDO_FORTE # Use `openssl rand -base64 32` no terminal
AUTH_URL=http://localhost:9003/api/auth # URL base para as rotas da API do NextAuth
# NEXTAUTH_URL=http://localhost:9003 # Alternativa ou complemento para AUTH_URL em algumas versões/deployments

# URL Base da Aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:9003

# Opcional: Para Genkit (se usar IA do Google)
# GOOGLE_API_KEY=<SUA_GOOGLE_AI_STUDIO_KEY>
```
*   `SUPABASE_SERVICE_ROLE_KEY`: É crucial para o SupabaseAdapter. **Trate-a como uma senha.**
*   `SUPABASE_JWT_SECRET`: Necessário se você quiser usar RLS com `supabaseAccessToken` gerado pelo adapter.

### 3. Configurar o Banco de Dados Supabase
Execute o script SQL de `docs/database_schema.sql` no Editor SQL do seu painel Supabase.
1.  Acesse seu projeto no Supabase.
2.  Vá para **SQL Editor** > **+ New query**.
3.  Copie e cole o conteúdo completo de `docs/database_schema.sql`.
4.  Clique em **RUN**.
    Isso criará o schema `next_auth` (para o adapter), a tabela `public.profiles` (para detalhes do usuário e senha), e outras tabelas do app.
5.  **Expor Schema `next_auth`:** No painel do Supabase, vá para **API Settings** (Configurações da API) (geralmente no ícone de engrenagem > API). Em "Config" > "Exposed schemas", adicione `next_auth` à lista (além de `public`, `storage`, etc.). Clique em Save.

### 4. Executar o Aplicativo
```bash
npm run dev
```
Servidor Next.js em `http://localhost:9003`.

### 5. Build para Produção
```bash
npm run build
```

### 6. Deploy com Netlify
Configure as variáveis de ambiente listadas acima no Netlify. A `AUTH_URL` (ou `NEXTAUTH_URL`) e `NEXT_PUBLIC_BASE_URL` devem ser a URL do seu site Netlify.

## 📂 Estrutura do Projeto
*   `src/app/`: Rotas e páginas (Next.js App Router).
    *   `(app)/`: Rotas protegidas.
    *   `login/`, `signup/`: Páginas públicas de autenticação.
    *   `api/auth/[...nextauth]/route.ts`: Configuração do NextAuth.js.
*   `src/components/`: Componentes React.
    *   `auth/`: Componentes para login/cadastro.
*   `src/lib/`: Utilitários, cliente Supabase.
*   `src/services/`: Funções para interagir com Supabase.
*   `src/ai/`: Configuração e fluxos Genkit.
*   `docs/`: Documentação, `database_schema.sql`.

## 🗺️ Roadmap
*   [ ] Implementação OAuth (Google, etc.) com NextAuth.js.
*   [ ] Testes.

## 🤝 Contribuir
Contribuições são bem-vindas! Fork, branch, commit, push, PR.

## 📜 Licença
MIT.
---
Cultive suas finanças com Flortune! 🌿💰
