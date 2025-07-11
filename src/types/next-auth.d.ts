import type { DefaultSession, User as NextAuthDefaultUser } from 'next-auth';
import type { JWT as NextAuthDefaultJWT } from '@auth/core/jwt';
import type { Profile as CustomAppProfile } from '@/types/database.types'; // Nossa tabela public.profiles

declare module 'next-auth' {
  /**
   * O objeto Session retornado pelo `useSession`, `getSession` e recebido no callback `session`.
   */
  interface Session extends DefaultSession {
    supabaseAccessToken?: string;
    user: {
      /** O ID do usuário (de `next_auth.users.id`, que deve ser o mesmo que `public.profiles.id`). */
      id: string;
      /** O perfil completo do usuário da nossa tabela `public.profiles`. */
      profile?: Omit<CustomAppProfile, 'hashed_password'> | null;
    } & Omit<DefaultSession['user'], 'id'>; // Mantém name, email, image, mas nosso 'id' e 'profile' têm precedência.
  }

  /**
   * O objeto User retornado pela função `authorize` do CredentialsProvider
   * e pelo callback `profile` dos provedores OAuth.
   * Este objeto é usado pelo SupabaseAdapter para criar/vincular o registro em `next_auth.users`.
   */
  interface User extends NextAuthDefaultUser {
    // Adicionamos o perfil aqui para que possamos passá-lo do 'authorize' para o 'jwt' callback
    profile?: Omit<CustomAppProfile, 'hashed_password'> | null;
  }
}

declare module '@auth/core/jwt' {
  /** O token JWT que é armazenado no cookie da sessão. */
  interface JWT extends NextAuthDefaultJWT {
    // Adicionamos o perfil ao token JWT para evitar buscas no banco de dados a cada chamada de sessão
    profile?: Omit<CustomAppProfile, 'hashed_password'> | null;
  }
}
