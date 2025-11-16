-- docs/admin_user_setup.sql
-- Este script cria um novo usuário administrador no Supabase.
-- IMPORTANTE: Substitua 'admin_seguro@exemplo.com' e 'senha-muito-forte-aqui' pelos seus dados desejados.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu novo administrador
  admin_email TEXT := 'admin@flortune.com';
  admin_password TEXT := 'senha-forte-aqui';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- 1. Inserir o novo usuário na tabela de autenticação do Supabase (auth.users)
  -- A função auth.uid() a partir do e-mail e senha irá criar o usuário se ele não existir
  -- e retornar seu ID. A senha é automaticamente criptografada (hashed).
  new_user_id := auth.uid(admin_email, admin_password);

  -- 2. Inserir o registro correspondente na tabela de perfis públicos (public.profiles)
  -- Este passo é crucial para associar dados da aplicação, como a role de administrador.
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
  -- A cláusula ON CONFLICT garante que, se um perfil com esse ID já existir 
  -- (por exemplo, criado por um trigger), ele será ATUALIZADO para ter a role de admin.
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = COALESCE(public.profiles.full_name, 'Administrador do Sistema'),
    display_name = COALESCE(public.profiles.display_name, 'Admin'),
    updated_at = NOW();

  RAISE NOTICE 'Usuário administrador criado/atualizado com sucesso com o e-mail: %', admin_email;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar o usuário administrador: %', SQLERRM;
END $$;
