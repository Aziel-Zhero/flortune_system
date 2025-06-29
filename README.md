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
    *   Transações (CRUD completo).
    *   Categorias (Leitura de categorias padrão e do usuário, adição de novas).
    *   Orçamentos (CRUD completo, acompanhamento de gastos).
    *   Metas Financeiras (CRUD completo, acompanhamento de progresso).
    *   Lista de Tarefas (CRUD completo).
*   📊 **Análise e Visualização:**
    *   Dashboard principal com resumos e destaques.
    *   Página de Análise com gráficos de gastos, receitas e fluxo de caixa.
    *   Calendário financeiro para visualização de eventos e transações.
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
AUTH_URL=http://localhost:9003/api/auth # URL base para as rotas da API do NextAuth em desenvolvimento
# NEXTAUTH_URL=http://localhost:9003 # Alternativa ou complemento para AUTH_URL. Prefira AUTH_URL.

# Google Provider (OAuth)
GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID_DO_GOOGLE_CLOUD_CONSOLE
GOOGLE_CLIENT_SECRET=SEU_GOOGLE_CLIENT_SECRET_DO_GOOGLE_CLOUD_CONSOLE

# URL Base da Aplicação (para desenvolvimento local)
NEXT_PUBLIC_BASE_URL=http://localhost:9003

# Opcional: Para Genkit (se usar IA do Google)
# GOOGLE_API_KEY=<SUA_GOOGLE_AI_STUDIO_KEY>
```
*   `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_JWT_SECRET`: Cruciais para o SupabaseAdapter e para a geração de tokens JWT para o Supabase. **Trate-os como senhas.**
*   `AUTH_SECRET`: Um segredo forte e aleatório é essencial para a segurança do NextAuth.js.
*   `AUTH_URL`: Em produção (Netlify), esta URL deve ser a URL do seu site implantado (ex: `https://seu-app.netlify.app/api/auth`).

### 3. Configurar o Banco de Dados Supabase
Execute o script SQL de `docs/database_schema.sql` no Editor SQL do seu painel Supabase.
1.  Acesse seu projeto no Supabase.
2.  Vá para **SQL Editor** > **+ New query**.
3.  Copie e cole o conteúdo completo de `docs/database_schema.sql`.
4.  Clique em **RUN**.
    Isso criará o schema `next_auth` (para o adapter), a tabela `public.profiles` (para detalhes do usuário e senha), e outras tabelas do app.
5.  **Expor Schema `next_auth`:** No painel do Supabase, vá para **Project Settings** (ícone de engrenagem) > **API**. Na seção "Config" > "Exposed schemas" (ou "Select schemas for Data API..."), adicione `next_auth` à lista (além de `public`). Clique em "Save".

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
2.  **Configure as Variáveis de Ambiente no Netlify:** Vá para Site configuration -> Build & deploy -> Environment -> Environment variables. Adicione **todas** as variáveis de ambiente do seu arquivo `.env` local, usando os valores corretos para produção.
    *   `AUTH_URL` deve ser `https://SEU-DOMINIO.netlify.app/api/auth`.
    *   `NEXT_PUBLIC_BASE_URL` deve ser `https://SEU-DOMINIO.netlify.app`.
3.  O Netlify usará o `netlify.toml` e o plugin `@netlify/plugin-nextjs` para construir e implantar seu site.

## 📂 Estrutura do Projeto
*   `src/app/`: Rotas e páginas (Next.js App Router).
    *   `(app)/`: Rotas protegidas que requerem autenticação.
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

### 1. Login com Google Falha com `Erro 400: redirect_uri_mismatch`

*   **Causa:** Este erro indica que a "URI de redirecionamento autorizada" configurada no Google Cloud Console para o seu Client ID OAuth não corresponde exatamente à URI que o NextAuth.js (e seu app) está usando.
*   **Solução:**
    1.  **Google Cloud Console:**
        *   Acesse o [Google Cloud Console](https://console.cloud.google.com/) > APIs e Serviços > Credenciais.
        *   Selecione seu ID do Cliente OAuth 2.0.
        *   Na seção "URIs de redirecionamento autorizadas", adicione **exatamente**:
            *   Para desenvolvimento local: `http://localhost:9003/api/auth/callback/google`
            *   Para produção (ex: Netlify): `https://SEU-DOMINIO.netlify.app/api/auth/callback/google` (substitua `SEU-DOMINIO.netlify.app` pelo seu URL real).
        *   Garanta que o protocolo (`http` vs `https`) e o caminho estejam corretos, sem barras extras no final. Salve as alterações.
    2.  **Variável de Ambiente `AUTH_URL`:**
        *   No seu arquivo `.env` (local) ou nas configurações de variáveis de ambiente do seu provedor de hospedagem (ex: Netlify), certifique-se de que `AUTH_URL` está definida corretamente:
            *   Local: `AUTH_URL=http://localhost:9003/api/auth`
            *   Produção: `AUTH_URL=https://SEU-DOMINIO.netlify.app/api/auth`

### 2. Cadastro Manual Falha com Erro de Chave Estrangeira (`violates foreign key constraint "profiles_id_fkey"`)

*   **Causa:** A tabela `public.profiles` tinha uma restrição de chave estrangeira direta (`profiles_id_fkey`) para `next_auth.users.id`. Durante o cadastro manual, o registro em `public.profiles` era criado *antes* do registro em `next_auth.users` (que é criado pelo SupabaseAdapter no primeiro login bem-sucedido), causando a violação da FK.
*   **Solução:**
    *   A restrição de chave estrangeira `profiles_id_fkey` foi removida do script `docs/database_schema.sql`.
    *   A ligação entre `public.profiles.id` e `next_auth.users.id` agora é feita por convenção (ambos usam o mesmo UUID para o mesmo usuário).
    *   O trigger `public.handle_new_user_from_next_auth` (que dispara na criação de um usuário em `next_auth.users`) é responsável por criar ou atualizar o registro correspondente em `public.profiles`, usando `ON CONFLICT (id) DO UPDATE` para sincronizar os dados. Isso permite que o perfil seja criado primeiro pela action `signupUser` e depois sincronizado/confirmado quando o NextAuth cria o usuário.

### 3. Cadastro Manual Falha com Erro de Política RLS (`new row violates row-level security policy for table "profiles"`)

*   **Causa:** A política de Row Level Security (RLS) na tabela `public.profiles` não permitia que a role `anon` (usada pela chave anônima do Supabase, que as Server Actions podem usar por padrão) inserisse novos registros.
*   **Solução:**
    *   Uma política RLS específica foi adicionada ao `docs/database_schema.sql` para permitir que a role `anon` insira em `public.profiles`:
        ```sql
        -- Permite que a action de signup (usando anon key) insira um novo perfil.
        -- A verificação de email duplicado já é feita na server action.
        DROP POLICY IF EXISTS "Allow anon to insert their own profile on signup" ON public.profiles;
        CREATE POLICY "Allow anon to insert their own profile on signup"
          ON public.profiles FOR INSERT
          TO anon
          WITH CHECK (true);
        ```
    *   A verificação de email duplicado e outros dados é feita na Server Action `signupUser` antes da tentativa de inserção.

### 4. Erros de Sintaxe SQL ao Executar `database_schema.sql`

*   **`ERROR: function public.uuid_generate_v4() does not exist`:**
    *   **Solução:** Garantiu-se que a extensão `uuid-ossp` é criada no schema `extensions` (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;`) e todas as chamadas `DEFAULT uuid_generate_v4()` foram alteradas para `DEFAULT extensions.uuid_generate_v4()`.
*   **`ERROR: policy "..." already exists` ou `ERROR: syntax error at or near "NOT" CREATE POLICY IF NOT EXISTS ...`:**
    *   **Solução:** A sintaxe `CREATE POLICY IF NOT EXISTS ...` não é válida no PostgreSQL. Foi corrigido para usar o padrão `DROP POLICY IF EXISTS nome_da_politica ON nome_da_tabela; CREATE POLICY nome_da_politica ON nome_da_tabela ...;` para todas as políticas.
*   **`ERROR: syntax error at or near "AS" ... AS $$` (para a função do trigger):**
    *   **Solução:** A declaração `SET search_path` foi movida para dentro do corpo da função PL/pgSQL (`BEGIN SET LOCAL search_path = public, extensions; ... END;`) em vez de ser uma opção de `CREATE FUNCTION`.

### 5. Build no Netlify Falha Devido a Variáveis de Ambiente Ausentes

*   **Causa:** Variáveis de ambiente críticas (como `AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, etc.) não estavam configuradas no ambiente de build do Netlify.
*   **Solução:**
    *   Todas as variáveis de ambiente necessárias do arquivo `.env` local **DEVEM** ser configuradas nas "Environment variables" do seu site no Netlify (Site configuration -> Build & deploy -> Environment).
    *   Lembre-se de usar os valores de produção corretos, especialmente para `AUTH_URL` (ex: `https://SEU-DOMINIO.netlify.app/api/auth`).

### 6. Build no Netlify Falha com Erro de "Node.js API is used ... not supported in the Edge Runtime"

*   **Causa:** Bibliotecas como `bcryptjs` e `jsonwebtoken`, usadas na rota de API do NextAuth (`src/app/api/auth/[...nextauth]/route.ts`), requerem o ambiente Node.js.
*   **Solução:**
    *   Adicionar `export const runtime = 'nodejs';` no início do arquivo `src/app/api/auth/[...nextauth]/route.ts` para forçar a execução desta rota no runtime Node.js.

### 7. Build no Netlify Falha com Erro de `useSearchParams() should be wrapped in a suspense boundary`

*   **Causa:** Componentes que usam o hook `useSearchParams` (como `LoginForm` e `SignupForm`) precisam ser envolvidos por `<Suspense fallback={...}>` quando renderizados em páginas que podem ser pré-renderizadas estaticamente.
*   **Solução:**
    *   Nas páginas de login (`src/app/login/page.tsx`) e cadastro (`src/app/signup/page.tsx`), os formulários foram envolvidos com `<Suspense>` e um componente de esqueleto como fallback.

### 8. Erro `Uncaught ReferenceError: [NomeDoComponenteDeGrafico] is not defined` (Página de Análise)
*   **Causa:** Conflito de nomes entre os ícones importados de `lucide-react` (ex: `LineChart`, `PieChart`) e os componentes de gráfico da biblioteca `recharts` com os mesmos nomes, ou importação incorreta dos componentes `recharts`.
*   **Solução:**
    *   Utilizar aliases ao importar os ícones de `lucide-react` para diferenciá-los dos componentes `recharts`. Ex: `import { LineChart as LineIconLucide, PieChart as PieIconLucide } from "lucide-react";`.
    *   Garantir que todos os componentes `recharts` necessários (ex: `LineChart`, `PieChart`, `XAxis`, `YAxis`, `CartesianGrid`, `ResponsiveContainer`, `Tooltip as RechartsTooltip`, `Legend`, `Cell`, `Bar`, `Area`, `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `RadialBar`, `LabelList`, `Brush`) sejam explicitamente importados de `"recharts"` no arquivo da página de Análise.
    *   Exemplo de importações corrigidas:
        ```tsx
        // No início do arquivo src/app/(app)/analysis/page.tsx
        import { 
          PieChart as PieIconLucide, // Alias para o ícone
          LineChart as LineIconLucide, // Alias para o ícone
          // Outros ícones Lucide...
        } from "lucide-react";
        import {
          LineChart, // Componente Recharts
          Line,
          XAxis,
          YAxis,
          CartesianGrid,
          ResponsiveContainer,
          PieChart, // Componente Recharts
          Pie,
          Cell,
          Tooltip as RechartsTooltip, // Alias para o tooltip do Recharts
          Legend,
          // Outros componentes Recharts...
        } from "recharts";
        ```

### 9. Erro `Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string.`
*   **Causa:** O componente `<SelectItem>` (usado em `Select` do ShadCN/Radix) não aceita `value=""`, `null`, ou `undefined`. Uma string vazia é reservada para limpar a seleção.
*   **Solução:**
    *   Para opções que representam "nenhum" ou "selecione", use uma constante string não vazia como valor. Exemplo em `src/lib/constants.ts`: `export const NO_ICON_VALUE = "__NO_ICON__";`.
    *   No formulário (ex: `src/app/(app)/goals/goal-form.tsx`), ao definir o `value` do `Select` no `Controller` do `react-hook-form`, use um fallback para essa constante se o valor do campo for `null` ou `undefined`. Ex: `value={field.value ?? NO_ICON_VALUE}`.
    *   O `<SelectItem>` correspondente deve ter `value={NO_ICON_VALUE}`.
    *   Ao submeter os dados do formulário, converta o valor da constante de volta para `null` se for apropriado para o backend. Ex: `icon: data.icon === NO_ICON_VALUE ? null : data.icon`.

### 10. Labels de Eixos de Gráficos "Saindo" do Card (Ex: Gráfico de Evolução Mensal)
*   **Causa:** Espaço insuficiente calculado pelo Recharts para os eixos devido a margens inadequadas no componente de gráfico (`LineChart`, `BarChart`, etc.) ou altura do `XAxis` inadequada para labels rotacionados.
*   **Solução:**
    *   Ajustar as propriedades `margin` do componente de gráfico. Ex: `<LineChart data={...} margin={{ top: 10, right: 30, left: 30, bottom: 70 }}>`. Aumentar `bottom` é crucial para labels X rotacionados, e `left` para labels Y.
    *   Para eixos X com labels rotacionados, aumentar a propriedade `height` do `XAxis` e usar `dy` para ajustar a posição vertical do texto. Ex: `<XAxis dataKey="month" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} dy={10} />`.
    *   Para eixos Y, usar `dx` para ajustar a posição horizontal. Ex: `<YAxis tickFormatter={...} tick={{ fontSize: 10 }} dx={-5} />`.

### 11. Erro 404 (Não Encontrado) para Novas Rotas (Ex: `/dev/systems`, `/transactions/new`)
*   **Causa:** Ausência dos arquivos `page.tsx` (ou `page.js`) correspondentes para as rotas definidas no sistema de arquivos do Next.js App Router.
*   **Solução:** Criar o arquivo `page.tsx` necessário dentro da pasta da respectiva rota. Por exemplo, para `/dev/systems`, criar `src/app/(app)/dev/systems/page.tsx`. Para `/transactions/new`, criar `src/app/(app)/transactions/new/page.tsx`.

### 12. Scroll Horizontal Indesejado na Tela (Layout Geral)
*   **Causa:** Um ou mais elementos no layout principal podem estar excedendo a largura da viewport, ou o gerenciamento de `overflow` não está correto.
*   **Solução:** Aplicar a classe `overflow-hidden` ao contêiner raiz do layout principal da aplicação (ex: o `div` em `src/app/(app)/layout.tsx` que envolve `AppHeader` e o conteúdo `<main>`). Isso previne que o contêiner raiz seja rolável, delegando o scroll vertical para o elemento `<main>` interno (que geralmente tem `overflow-y-auto`).

### 13. Calendário com Layout Quebrado ou Erro `getDay is not defined`
*   **Causa:** A implementação de calendário anterior era customizada, com bugs, e não se adaptava bem ao contêiner flexível do layout principal, causando um visual "espremido". Além disso, uma chamada incorreta à função `getDay` (sem ser a partir de um objeto `Date`) causava um `ReferenceError` que impedia o carregamento da página.
*   **Solução:** A página de calendário foi totalmente reconstruída usando a biblioteca **FullCalendar**, que é robusta e estável. Para corrigir o problema de layout, a classe `min-w-0` foi adicionada ao elemento `<main>` em `src/app/(app)/layout.tsx`, permitindo que componentes flexíveis como o FullCalendar se redimensionem corretamente sem estourar o layout.

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
