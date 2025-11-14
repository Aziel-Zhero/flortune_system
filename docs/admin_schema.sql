-- /---------------------------------------------------------------------------------------\
-- |                                                                                       |
-- |     █████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗          (ADMIN SCHEMA)                     |
-- |    ██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║                                           |
-- |    ███████║██║  ██║██╔████╔██║██║██╔██╗ ██║                                           |
-- |    ██╔══██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║                                           |
-- |    ██║  ██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║                                           |
-- |    ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝                                           |
-- |                                                                                       |
-- |  ✅ Script para a Estrutura de Administradores do Projeto Flortune                      |
-- |  Este script é IDEMPOTENTE e focado apenas na criação e gerenciamento de admins.      |
-- |                                                                                       |
-- \---------------------------------------------------------------------------------------/

-- Habilitar a extensão pgcrypto se ainda não estiver habilitada.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de Administradores
-- Tabela dedicada para armazenar informações dos administradores.
-- A senha é armazenada com hash usando a extensão pgcrypto.
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    hashed_password text NOT NULL, -- Senha com hash
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilita a segurança a nível de linha na tabela de administradores.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Por padrão, ninguém pode ver os dados da tabela de admins.
-- Políticas específicas podem ser adicionadas se for necessário que um admin veja outros.
-- No momento, a verificação é feita apenas no backend com a chave de serviço.


-- 2. Gatilho para Sincronizar Novos Administradores com Supabase Auth
-- Esta função é o coração da sincronização. Quando você insere um novo admin na tabela `public.admins`,
-- este gatilho cria um usuário correspondente no sistema de autenticação do Supabase (`auth.users`).
-- Isso permite que o admin use o mesmo fluxo de login, receba e-mails de confirmação, etc.
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função opere com privilégios elevados para inserir em auth.users
SET search_path = public
AS $$
BEGIN
  -- Insere o novo usuário na tabela de autenticação do Supabase.
  -- Os metadados são populados para que o perfil possa ser enriquecido posteriormente, se necessário.
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, 
    raw_user_meta_data, created_at, updated_at, phone, phone_confirmed_at, 
    email_change, email_change_token_new, email_change_token_current, email_change_sent_at
  ) values (
    '00000000-0000-0000-0000-000000000000', NEW.id, 'authenticated', 'authenticated', 
    NEW.email, NEW.hashed_password, NULL, -- Email não confirmado inicialmente
    NULL, NULL, NULL, 
    '{"provider":"email","providers":["email"]}', 
    json_build_object('full_name', NEW.full_name, 'role', 'admin'), -- Injeta a role de admin nos metadados
    current_timestamp, current_timestamp, 
    NULL, NULL, '', '', '', NULL
  );
  RETURN NEW;
END;
$$;

-- Aplica o gatilho à tabela public.admins.
-- Ele será disparado APÓS cada inserção de um novo administrador.
DROP TRIGGER IF EXISTS on_admin_created ON public.admins;
CREATE TRIGGER on_admin_created
  AFTER INSERT ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();

-- Mensagem de finalização
SELECT '✅ Schema de Admin (admins) configurado com sucesso.' as status;
