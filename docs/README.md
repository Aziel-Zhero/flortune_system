# Documentação do Projeto Flortune

Este diretório contém documentos de suporte e informações adicionais sobre o projeto Flortune.

## Conteúdo

-   [`database_schema.sql`](./database_schema.sql): Script SQL completo para criar todas as tabelas, schemas, triggers e políticas de segurança (RLS) necessárias para a aplicação no Supabase.

## Como Usar

### `database_schema.sql`

Este é o arquivo mais crítico para a configuração inicial do projeto. Ele contém todas as definições do banco de dados PostgreSQL no Supabase.

**Importante:** Execute este script no **SQL Editor** do seu painel Supabase **antes** de tentar rodar a aplicação pela primeira vez. Se você já executou uma versão anterior, executar este script novamente irá limpar e recriar as políticas e funções para garantir que a versão mais recente esteja em vigor, o que é crucial para corrigir problemas de autenticação.

#### Passos para Execução:
1.  Acesse seu projeto no painel do [Supabase](https://supabase.com/).
2.  No menu lateral, vá para **SQL Editor**.
3.  Clique em **+ New query**.
4.  Copie o conteúdo completo do arquivo `database_schema.sql` e cole no editor.
5.  Clique em **RUN**.

Isso irá configurar:
- O schema `next_auth` necessário para o `SupabaseAdapter` do NextAuth.js.
- A tabela `public.profiles` para armazenar informações detalhadas dos usuários.
- As tabelas principais da aplicação: `transactions`, `categories`, `budgets`, `financial_goals`.
- As políticas de Row Level Security (RLS) que garantem que os usuários só possam acessar seus próprios dados.
- **Importante:** O trigger que criava perfis automaticamente foi removido para dar lugar a uma lógica mais segura e centralizada nas Server Actions da aplicação.

**Aviso sobre Variáveis de Ambiente:**

Para que o `SupabaseAdapter` e outras partes da aplicação funcionem corretamente, é **essencial** que as seguintes variáveis de ambiente estejam configuradas corretamente no seu arquivo `.env` (ou nas configurações do seu provedor de hospedagem, como Netlify):

-   `NEXT_PUBLIC_SUPABASE_URL`
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
-   `SUPABASE_SERVICE_ROLE_KEY` (Chave secreta, trate como senha)
-   `SUPABASE_JWT_SECRET` (Segredo do JWT, trate como senha)

Sem essas chaves, a aplicação não conseguirá se comunicar com o banco de dados de forma segura e autenticada, resultando em erros durante o login, cadastro e outras operações.
