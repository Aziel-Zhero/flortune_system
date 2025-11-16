-- docs/admin_user_setup.sql
-- Este script cria um novo usuário administrador no Supabase, inserindo os dados diretamente nas tabelas de autenticação.
-- IMPORTANTE: Substitua 'admin_seguro@exemplo.com' e 'senha-muito-forte-aqui' pelos seus dados desejados.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu novo administrador
  admin_email TEXT := 'admin@flortune.com';
  admin_password TEXT := 'senha-muito-forte-aqui';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- Este bloco garante que a extensão pgcrypto, necessária para criptografar a senha, esteja disponível.
  CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

  -- 1. Inserir o novo usuário na tabela principal de autenticação (auth.users)
  --    e retornar o ID gerado para a variável new_user_id.
  INSERT INTO auth.users (instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id padrão
    'authenticated', -- role padrão para usuários autenticados
    'authenticated', -- role padrão
    admin_email,
    extensions.crypt(admin_password, extensions.gen_salt('bf')), -- Criptografa a senha
    NOW(), -- Confirma o email imediatamente
    NULL, NULL, NULL, -- Campos de recuperação de senha
    '{"provider":"email","providers":["email"]}', -- Metadados do app
    '{}', -- Metadados do usuário (vazio por padrão)
    FALSE, -- Não é um super admin do Supabase
    NOW(), NOW() -- Timestamps
  ) RETURNING id INTO new_user_id;

  -- 2. Inserir a identidade do usuário, vinculando o ID do usuário ao seu e-mail.
  --    Isso é crucial para o login com e-mail e senha.
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    extensions.uuid_generate_v4(), -- Gera um novo UUID para a identidade
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', admin_email), -- Dados da identidade
    'email', -- Provedor de identidade
    NOW(), -- Último login
    NOW(), NOW() -- Timestamps
  );

  -- 3. Inserir o registro correspondente na tabela de perfis públicos (public.profiles)
  --    Este passo associa dados da aplicação, como a role de administrador.
  INSERT INTO public.profiles (id, email, full_name, display_name, role, account_type, has_seen_welcome_message)
  VALUES (
    new_user_id,
    admin_email,
    'Administrador do Sistema', -- Nome completo padrão
    'Admin', -- Nome de exibição padrão
    'admin', -- << IMPORTANTE: Define o usuário como administrador
    'pessoa', -- Tipo de conta padrão
    TRUE -- Marca a mensagem de boas-vindas como vista
  )
  -- A cláusula ON CONFLICT garante que, se um perfil com esse ID já existir (improvável, mas seguro), ele seja ATUALIZADO.
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = COALESCE(public.profiles.full_name, 'Administrador do Sistema'),
    display_name = COALESCE(public.profiles.display_name, 'Admin'),
    updated_at = NOW();

  RAISE NOTICE 'Usuário administrador criado com sucesso com o e-mail: %', admin_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar o usuário administrador: %', SQLERRM;
END $$;
