-- docs/admin_user_setup.sql
-- Este script cria um novo usuário administrador no Supabase ou atualiza um usuário existente para ser admin.
-- IMPORTANTE: Substitua 'admin@flortune.com' e 'senha-muito-forte-aqui' pelos seus dados desejados.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu administrador
  admin_email TEXT := 'admin@flortune.com';
  admin_password TEXT := 'senha-muito-forte-aqui';
  
  -- Variável para armazenar o ID do usuário
  user_id_var UUID;
BEGIN
  -- 1. Verifica se o usuário já existe na autenticação (auth.users)
  SELECT id INTO user_id_var FROM auth.users WHERE email = admin_email;

  -- 2. Se o usuário não existir, cria um novo na autenticação
  IF user_id_var IS NULL THEN
    RAISE NOTICE 'Usuário com e-mail % não encontrado em auth.users. Criando um novo usuário...', admin_email;
    
    -- Insere na tabela auth.users e retorna o novo ID
    -- Removida a coluna 'confirmed_at' que estava causando o erro.
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', admin_email, crypt(admin_password, gen_salt('bf')), NOW(), NULL, NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), NULL, '', NULL
    ) RETURNING id INTO user_id_var;
    
    -- Insere a identidade correspondente
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), user_id_var, jsonb_build_object('sub', user_id_var, 'email', admin_email), 'email', NOW(), NOW(), NOW()
    );
  ELSE
    RAISE NOTICE 'Usuário com e-mail % já existe em auth.users. ID: %', admin_email, user_id_var;
    -- Se o usuário já existe, podemos garantir que a senha está atualizada (opcional)
    UPDATE auth.users SET encrypted_password = crypt(admin_password, gen_salt('bf')) WHERE id = user_id_var;
  END IF;

  -- 3. Insere ou Atualiza o registro na tabela de perfis públicos (public.profiles)
  -- Esta cláusula ON CONFLICT lida com o erro de chave duplicada no e-mail ou id.
  INSERT INTO public.profiles (id, email, full_name, display_name, role, account_type, has_seen_welcome_message)
  VALUES (
    user_id_var,
    admin_email,
    'Administrador do Sistema',
    'Admin',
    'admin', -- Define (ou garante) que o usuário é administrador
    'pessoa',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

  RAISE NOTICE 'Usuário administrador (%) foi criado ou atualizado com sucesso.', admin_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar/atualizar o usuário administrador: %', SQLERRM;
END $$;
