-- ATENÇÃO: Execute este script no SQL Editor do seu painel Supabase.
-- Lembre-se de substituir 'admin@flortune.com' e 'senha-forte-aqui' pelos dados desejados.
-- ESTE SCRIPT ASSUME QUE O USUÁRIO NÃO EXISTE. Se ele existir, delete-o primeiro.

DO $$
DECLARE
  -- Defina aqui as credenciais do seu novo administrador
  admin_email TEXT := 'aziel_1994@hotmail.com';
  admin_password TEXT := 'Aziel25*';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- 1. Criar o usuário no sistema de autenticação usando a função oficial.
  -- A função retorna o ID do novo usuário.
  -- Se o usuário já existir, esta chamada irá falhar, o que é esperado.
  -- Garanta que o usuário não exista antes de rodar.
  SELECT auth.signup(admin_email, admin_password) INTO new_user_id;

  RAISE NOTICE 'Usuário criado com sucesso na autenticação com ID: %', new_user_id;

  -- 2. Atualizar o perfil recém-criado para ter a role de 'admin'.
  -- Um trigger no Supabase já criou um registro básico na tabela 'profiles'.
  -- Nós apenas precisamos garantir que a role está correta.
  UPDATE public.profiles
  SET 
    role = 'admin',
    full_name = 'Administrador do Sistema',
    display_name = 'Admin',
    has_seen_welcome_message = TRUE,
    updated_at = NOW()
  WHERE id = new_user_id;

  RAISE NOTICE 'Perfil do usuário com ID % atualizado para administrador.', new_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar o usuário administrador: %. Verifique se o usuário já existe antes de executar o script.', SQLERRM;
END $$;
