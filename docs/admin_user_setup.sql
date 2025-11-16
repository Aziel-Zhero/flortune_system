-- docs/admin_user_setup.sql
-- Este script cria um novo usuário administrador no Supabase usando a função oficial auth.signup().
-- IMPORTANTE: Substitua 'admin@flortune.com' e 'senha-muito-forte-aqui' pelos seus dados desejados.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu novo administrador
  admin_email TEXT := 'admin@flortune.com';
  admin_password TEXT := 'senha-muito-forte-aqui';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- 1. Cria o usuário usando a função auth.signup()
  -- Esta função lida com a criação do usuário em auth.users e auth.identities
  -- e retorna o ID do novo usuário.
  SELECT auth.signup(admin_email, admin_password) INTO new_user_id;

  -- 2. Insere ou Atualiza o registro na tabela de perfis públicos (public.profiles)
  -- A cláusula ON CONFLICT (id) DO UPDATE garante que, se um perfil com esse ID já existir
  -- (criado pelo trigger padrão do Supabase), ele será ATUALIZADO para ter a role de admin.
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
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

  -- 3. Confirma o e-mail do usuário administrativamente, já que estamos criando via servidor.
  -- Isto é necessário porque auth.signup() normalmente envia um e-mail de confirmação.
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = new_user_id;

  RAISE NOTICE 'Usuário administrador (%) foi criado ou atualizado com sucesso.', admin_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar/atualizar o usuário administrador: %', SQLERRM;
END $$;
