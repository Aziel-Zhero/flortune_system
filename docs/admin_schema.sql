-- Tabela para armazenar perfis de administradores do sistema.
-- Esta tabela é separada dos perfis de usuários comuns para maior segurança.
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    full_name text,
    email text NOT NULL UNIQUE,
    hashed_password text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Ativa a Row Level Security (RLS) para a tabela de administradores.
-- Isso garante que nenhuma consulta possa ser feita sem uma política explícita.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para garantir que a versão mais recente seja aplicada.
DROP POLICY IF EXISTS "Admins can view all admin profiles." ON public.admins;
DROP POLICY IF EXISTS "Enable read access for authenticated admins" ON public.admins;


-- CRIAÇÃO DA POLÍTICA DE LEITURA (SELECT)
-- Esta política é a correção crucial.
-- Ela permite que um usuário, cuja sessão tenha a role 'admin', possa ler
-- os dados da tabela 'admins'. Sem isso, a verificação de sessão falha.
CREATE POLICY "Admins can view all admin profiles."
    ON public.admins FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);


-- INSERÇÃO DE USUÁRIO ADMIN PADRÃO (Exemplo)
-- Este comando insere um usuário administrador padrão se a tabela estiver vazia.
-- A senha 'Admin2025*' é hasheada com bcrypt.
-- Lembre-se de alterar esta senha em um ambiente de produção.
INSERT INTO public.admins (email, full_name, hashed_password)
SELECT 'admin@flortune.com', 'Admin Flortune', '$2a$12$0rcHcyrn9oeU18xKxcntZeiKNzy4k798hBZ4MwaO1HTkIMAmPJuZK'
WHERE NOT EXISTS (SELECT 1 FROM public.admins WHERE email = 'admin@flortune.com');

-- Informa ao PostgREST para recarregar o esquema e reconhecer a nova tabela/políticas.
NOTIFY pgrst, 'reload schema';
