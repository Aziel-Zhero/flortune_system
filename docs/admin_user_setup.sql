-- ATENÇÃO: Execute este script no SQL Editor do seu painel Supabase.
-- Lembre-se de substituir 'admin@flortune.com' e 'senha-forte-aqui' pelos dados desejados.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu novo administrador
  admin_email TEXT := 'aziel_1994@hotmail.com';
  admin_password TEXT := 'Aziel25*';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- 1. Tenta criar o usuário usando a função oficial do Supabase Auth.
  -- Esta função lida com a criação segura do usuário e a criptografia da senha.
  -- A cláusula de tratamento de exceção lida com o caso de o usuário já existir.
  BEGIN
    new_user_id := (SELECT auth.signup(admin_email, admin_password));
    RAISE NOTICE 'Novo usuário de autenticação criado com o ID: %', new_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se o usuário já existir, a função auth.signup() pode gerar um erro.
      -- Neste caso, nós buscamos o ID do usuário existente.
      RAISE NOTICE 'Usuário com e-mail % já existe. Buscando ID...', admin_email;
      SELECT id INTO new_user_id FROM auth.users WHERE email = admin_email;
      IF new_user_id IS NULL THEN
        RAISE EXCEPTION 'Falha ao encontrar o ID do usuário existente: %', admin_email;
      END IF;
  END;

  -- 2. Garante que o e-mail do usuário está confirmado, pois estamos criando administrativamente.
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = new_user_id;

  -- 3. Insere ou Atualiza o registro na tabela de perfis públicos (public.profiles)
  -- Esta cláusula ON CONFLICT lida com o caso de o perfil já existir, garantindo que a role seja 'admin'.
  INSERT INTO public.profiles (id, email, full_name, display_name, role, account_type, has_seen_welcome_message)
  VALUES (
    new_user_id,
    admin_email,
    'Administrador do Sistema',
    'Admin',
    'admin', -- << IMPORTANTE: Define o usuário como administrador
    'pessoa',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

  RAISE NOTICE 'Usuário administrador (%) foi configurado com sucesso.', admin_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro geral ao tentar criar/atualizar o usuário administrador: %', SQLERRM;
END $$;
