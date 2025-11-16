-- ATENÇÃO: Execute este script no SQL Editor do seu painel Supabase.
-- Lembre-se de substituir 'admin@flortune.com' e 'senha-forte-aqui' pelos dados desejados.

DO $$
DECLARE
  admin_email TEXT := 'admin@flortune.com';
  admin_password TEXT := 'senha-forte-aqui';
  new_user_id UUID;
BEGIN
  -- 1. Criar o usuário no sistema de autenticação usando a função oficial `auth.user_create()`.
  -- Esta função lida com toda a lógica interna de criação e criptografia de senha.
  -- Ela retorna o ID do usuário recém-criado.
  SELECT auth.user_create(admin_email, admin_password) INTO new_user_id;

  -- 2. Atualizar o registro correspondente na tabela de perfis públicos (public.profiles)
  -- para definir a role como 'admin'. O trigger do Supabase já deve ter criado o perfil básico.
  UPDATE public.profiles
  SET 
    role = 'admin',
    full_name = 'Administrador do Sistema',
    display_name = 'Admin',
    updated_at = NOW()
  WHERE id = new_user_id;

  RAISE NOTICE 'Usuário administrador criado com sucesso. E-mail: %, ID: %', admin_email, new_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar o usuário administrador: %', SQLERRM;
END $$;
