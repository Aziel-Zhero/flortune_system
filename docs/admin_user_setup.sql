-- docs/admin_user_setup.sql
-- Este script cria um novo usuário administrador no Supabase.
-- IMPORTANTE: Substitua 'admin@flortune.com' e 'senha-muito-forte-aqui' pelos seus dados desejados.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu novo administrador
  admin_email TEXT := 'admin@flortune.com';
  admin_password TEXT := 'senha-muito-forte-aqui';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- 1. Inserir o novo usuário na tabela de autenticação do Supabase (auth.users)
  -- e obter o ID gerado para a variável new_user_id.
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id padrão
    extensions.uuid_generate_v4(), -- gera um novo UUID para o usuário
    'authenticated', -- audiência padrão
    'authenticated', -- role de autenticação padrão
    admin_email, -- e-mail fornecido
    crypt(admin_password, gen_salt('bf')), -- criptografa a senha
    NOW(), -- define o e-mail como confirmado
    NULL, NULL, NULL, -- campos de recuperação e último login
    '{"provider":"email","providers":["email"]}', -- metadados do app
    '{}', -- metadados do usuário
    NOW(), NOW() -- timestamps
  ) RETURNING id INTO new_user_id;

  -- 2. Inserir a identidade do usuário (necessário para login com e-mail/senha)
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    extensions.uuid_generate_v4(), -- novo UUID para a identidade
    new_user_id, -- ID do usuário criado no passo anterior
    json_build_object('sub', new_user_id, 'email', admin_email), -- dados da identidade
    'email', -- provedor de identidade
    NOW(), NOW(), NOW()
  );

  -- 3. Inserir o registro correspondente na tabela de perfis públicos (public.profiles)
  -- Este passo é crucial para associar dados da aplicação, como a role de administrador.
  INSERT INTO public.profiles (id, email, full_name, display_name, role, account_type, has_seen_welcome_message, updated_at, created_at)
  VALUES (
    new_user_id,
    admin_email,
    'Administrador do Sistema', -- Nome completo padrão
    'Admin', -- Nome de exibição padrão
    'admin', -- << IMPORTANTE: Define o usuário como administrador
    'pessoa', -- Tipo de conta padrão
    TRUE, -- Marca a mensagem de boas-vindas como vista
    NOW(), NOW()
  )
  -- A cláusula ON CONFLICT garante que, se um perfil com esse ID já existir 
  -- (por exemplo, criado por um trigger), ele será ATUALIZADO para ter a role de admin.
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
