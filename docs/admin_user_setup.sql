-- /---------------------------------------------------------------------------------------\
-- |                                                                                       |
-- |  ✅ Script DEFINITIVO para Criação de Usuário Administrador                             |
-- |  Este script utiliza as funções oficiais do Supabase para garantir a criação          |
-- |  correta e segura de um usuário com privilégios de administrador.                    |
-- |                                                                                       |
-- |  Instruções:                                                                         |
-- |  1. Substitua 'seu-email-admin@exemplo.com' e 'sua-senha-super-segura' abaixo.       |
-- |  2. Se o usuário já existir (mesmo como usuário normal), apague-o primeiro no        |
-- |     painel de Autenticação do Supabase antes de rodar este script.                    |
-- |  3. Copie e execute este código no SQL Editor do seu projeto Supabase.               |
-- |                                                                                       |
-- \---------------------------------------------------------------------------------------/

DO $$
DECLARE
  -- >>>>> PREENCHA ESTAS DUAS LINHAS COM SUAS CREDENCIAIS <<<<<
  admin_email TEXT := 'aziel_1994@hotmail.com';
  admin_password TEXT := 'Aziel25*';
  
  -- Variável para armazenar o ID do novo usuário
  new_user_id UUID;
BEGIN
  -- ETAPA 1: Criar o usuário de forma segura usando a função auth.signup()
  -- Esta função lida com a criação do usuário em auth.users e auth.identities,
  -- além de criptografar a senha corretamente.
  SELECT auth.signup(admin_email, admin_password) INTO new_user_id;

  -- Se a função acima for executada, o trigger 'handle_new_user' (do seu database_schema.sql)
  -- já terá criado uma entrada na tabela 'public.profiles' com a role padrão 'user'.

  -- ETAPA 2: Atualizar o perfil recém-criado para definir a role como 'admin'.
  -- Nós não inserimos (INSERT), nós atualizamos (UPDATE) o perfil que o trigger criou.
  UPDATE public.profiles
  SET 
    role = 'admin', -- <<< A MÁGICA ACONTECE AQUI
    full_name = 'Administrador', -- Define um nome padrão
    display_name = 'Admin', -- Define um nome de exibição padrão
    has_seen_welcome_message = TRUE,
    updated_at = NOW()
  WHERE id = new_user_id;

  RAISE NOTICE 'Usuário administrador (%) criado e configurado com sucesso. ID: %', admin_email, new_user_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Esta exceção será acionada se, por exemplo, o e-mail já existir.
    RAISE EXCEPTION 'Ocorreu um erro ao tentar criar o usuário administrador: %. Verifique se o usuário já existe antes de executar.', SQLERRM;
END $$;
