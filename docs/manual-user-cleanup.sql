-- ATENÇÃO: Use este script com cuidado. Ele deleta permanentemente um usuário.
-- Substitua 'flortune_@outlook.com' pelo email exato do usuário que você deseja remover.

-- Passo 1: Encontrar o ID do usuário na tabela de autenticação do Supabase
-- (Este passo é opcional, mas útil para confirmar que você está deletando o usuário certo)
-- SELECT id FROM auth.users WHERE email = 'flortune_@outlook.com';

-- Passo 2: Deletar o usuário. O Supabase é configurado com "Cascading Deletes",
-- o que significa que ao deletar o usuário da tabela `auth.users`, ele
-- deve remover automaticamente os registros relacionados em `public.profiles`.
-- Este é o único comando que você precisa executar.

DELETE FROM auth.users WHERE email = 'flortune_@outlook.com';

-- Se por algum motivo o delete em cascata não funcionar, você pode rodar
-- o comando abaixo manualmente após o primeiro, mas geralmente não é necessário.
-- DELETE FROM public.profiles WHERE email = 'flortune_@outlook.com';

-- Após executar o comando DELETE, o usuário é removido e o e-mail fica livre
-- para um novo cadastro.
