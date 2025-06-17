
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
    // O `id` aqui DEVE ser o ID que será usado em `next_auth.users.id` e `public.profiles.id`.
    // Para Credentials, retornamos o `id` de `public.profiles`.
    // Para OAuth, o provedor OAuth fornece um ID (ex: `profile.sub` do Google),
    // que o NextAuth usa como `user.id` e o adapter usa para `next_auth.users.id`.
    // Os campos `name`, `email`, `image` são padrão e usados pelo adapter.
  }
}

declare module '@auth/core/jwt' {
  /** O token JWT que é armazenado no cookie da sessão. */
  interface JWT extends NextAuthDefaultJWT {
    // O `sub` (subject) é automaticamente definido como o `user.id` (de `next_auth.users.id`).
    // Podemos adicionar outros campos aqui se precisarmos passá-los para o callback `session`.
    // Por exemplo, se o ID do perfil fosse diferente do ID do next_auth.user, poderíamos armazená-lo aqui.
    // No nosso caso, eles são os mesmos.
  }
}
