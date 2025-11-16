-- ATENÇÃO: ESTE SCRIPT APAGA USUÁRIOS DE FORMA IRREVERSÍVEL.
-- FAÇA UM BACKUP DO SEU BANCO DE DADOS ANTES DE EXECUTAR.

DO $$
DECLARE
  -- *******************************************************************
  -- **  OPCIONAL: PREENCHA ESTE E-MAIL SE VOCÊ QUISER MANTER UM ADMIN  **
  -- **  Deixe em branco ('') para apagar TODOS os usuários.           **
  -- *******************************************************************
  email_to_keep TEXT := 'admin_seguro@exemplo.com'; 
  
  -- Variável para iterar sobre os usuários a serem deletados
  user_record RECORD;
BEGIN
  -- Este laço percorre todos os usuários na tabela auth.users,
  -- exceto aquele cujo e-mail foi especificado na variável email_to_keep.
  FOR user_record IN 
    SELECT id FROM auth.users WHERE email <> email_to_keep OR email_to_keep = ''
  LOOP
    -- A função delete_user da API do Supabase (disponível em SQL)
    -- lida com a exclusão do usuário em todas as tabelas relacionadas
    -- (auth.users, auth.identities, auth.sessions, etc.), garantindo uma limpeza completa.
    PERFORM auth.delete_user(user_record.id);
    RAISE NOTICE 'Usuário com ID % foi deletado.', user_record.id;
  END LOOP;

  RAISE NOTICE 'Processo de exclusão de usuários concluído.';
END $$;
