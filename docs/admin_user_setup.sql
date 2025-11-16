-- ATENÇÃO: Execute este script no SQL Editor do seu painel Supabase.
-- Lembre-se de substituir 'admin@flortune.com' e 'senha-forte-aqui' pelos dados desejados.

-- Inserir o novo usuário de autenticação.
-- O Supabase cuidará da criptografia da senha.
-- A função retorna o ID do novo usuário.
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- 1. Criar o usuário no sistema de autenticação do Supabase
    new_user_id := (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email = 'admin@flortune.com'
    );

    IF new_user_id IS NULL THEN
        -- O usuário não existe, então vamos criá-lo
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, confirmation_sent_at)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            extensions.uuid_generate_v4(),
            'authenticated',
            'authenticated',
            'admin@flortune.com',
            crypt('senha-forte-aqui', gen_salt('bf')),
            NOW(),
            '',
            NULL,
            NULL,
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            NULL
        ) RETURNING id INTO new_user_id;
    ELSE
        -- O usuário já existe, vamos apenas garantir que o perfil está correto.
        RAISE NOTICE 'Usuário com e-mail admin@flortune.com já existe. Verificando perfil...';
    END IF;

    -- 2. Inserir/Atualizar o perfil público e definir a role como 'admin'
    -- O trigger 'handle_new_user' já deve ter criado um perfil básico.
    -- Usamos ON CONFLICT para garantir que, se o perfil já existir, ele seja atualizado.
    INSERT INTO public.profiles (id, email, full_name, display_name, role)
    VALUES (new_user_id, 'admin@flortune.com', 'Administrador', 'Admin', 'admin')
    ON CONFLICT (id) 
    DO UPDATE SET 
        role = 'admin',
        full_name = 'Administrador',
        display_name = 'Admin',
        updated_at = NOW();
    
    RAISE NOTICE 'Usuário administrador configurado com sucesso. ID: %', new_user_id;

END $$;
