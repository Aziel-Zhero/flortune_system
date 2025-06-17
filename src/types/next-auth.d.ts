
import type { DefaultSession, User as NextAuthDefaultUser } from 'next-auth';
import type { JWT as NextAuthDefaultJWT } from '@auth/core/jwt';
import type { Profile as CustomAppProfile } from '@/types/database.types'; // Nossa tabela public.profiles

declare module 'next-auth' {
  interface Session extends DefaultSession {
    supabaseAccessToken?: string; // Adicionado pelo callback de sessão do SupabaseAdapter
    user: {
      id: string; // ID do usuário (de public.profiles.id e next_auth.users.id)
      // Outros campos padrão do NextAuth como name, email, image podem vir do token
      // Se não vierem, serão preenchidos a partir do profile abaixo.
      profile?: Omit<CustomAppProfile, 'hashed_password'> | null; // Nosso perfil customizado
    } & Omit<DefaultSession['user'], 'id'>; // Mantém name, email, image, mas nosso 'id' e 'profile' são primários
  }

  // O objeto User que a função `authorize` retorna e que é passado para os callbacks.
  // Deve ser compatível com o que o SupabaseAdapter espera para criar/vincular o next_auth.users.
  interface User extends NextAuthDefaultUser {
    // O adapter usará id, name, email, image para popular next_auth.users.
    // Se o CredentialsProvider retornar mais campos, eles não irão para next_auth.users automaticamente,
    // mas podem ser usados no callback jwt e session para popular o objeto session.user.
    // Para consistência, o `id` retornado pelo `authorize` DEVE ser o `id` de `public.profiles`.
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends NextAuthDefaultJWT {
    // O token JWT que é armazenado no cookie da sessão.
    // O `sub` (subject) normalmente é o user.id.
    // Podemos adicionar campos customizados aqui se necessário, que são então passados para o callback de session.
    // Por exemplo, se quisermos carregar o perfil completo apenas uma vez no jwt e não em cada session call.
    // No entanto, para dados que podem mudar, buscar no session callback é mais atual.
    // O SupabaseAdapter adiciona o id do usuário automaticamente ao token (geralmente como `sub`).
    // `name`, `email`, `picture` também são campos comuns.
    // O `id` que usamos na session será o `token.sub`.
    // `token.profile` poderia ser adicionado aqui, mas vamos buscar no session callback para dados mais frescos.
  }
}
