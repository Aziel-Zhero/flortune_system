-- Este script apaga TODOS os usuários da autenticação, EXCETO o especificado na variável email_to_keep.
-- IMPORTANTE:
-- 1. Substitua 'admin_seguro@exemplo.com' pelo e-mail do usuário que você deseja MANTER.
-- 2. Se você quiser apagar TODOS os usuários sem exceção, deixe a variável email_to_keep como uma string vazia ('').
-- 3. Esta ação é IRREVERSÍVEL. Faça um backup se tiver dados importantes.

DO $$
DECLARE
  -- Defina aqui o e-mail do único usuário que você NÃO quer apagar.
  email_to_keep TEXT := 'aziel_1994@hotmail.com';
  user_count INT;
BEGIN
  -- Conta quantos usuários serão deletados
  SELECT count(*)
  INTO user_count
  FROM auth.users
  WHERE email <> email_to_keep OR email_to_keep = '';

  -- Executa a exclusão
  DELETE FROM auth.users
  WHERE email <> email_to_keep OR email_to_keep = '';

  RAISE NOTICE '% usuários foram deletados. O usuário ''%'' foi mantido.', user_count, email_to_keep;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ocorreu um erro ao tentar deletar os usuários: %', SQLERRM;
END $$;
