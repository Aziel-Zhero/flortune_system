
import type { DefaultSession, User as NextAuthDefaultUser } from 'next-auth';
import type { JWT as NextAuthDefaultJWT } from '@auth/core/jwt';
import type { Profile as CustomAppProfile } from '@/types/database.types';

declare module 'next-auth' {
  /**
   * O objeto Session retornado pelo `useSession`, `getSession` e recebido no callback `session`.
   */
  interface Session extends DefaultSession {
    supabaseAccessToken?: string;
    user: {
      id: string;
      profile?: CustomAppProfile; // Tornamos não-opcional e garantimos que a role esteja lá
    } & Omit<DefaultSession['user'], 'id'>;
  }

  /**
   * O objeto User retornado pela função `authorize` ou pelo callback `profile` dos provedores OAuth.
   */
  interface User extends NextAuthDefaultUser {
    profile?: CustomAppProfile;
    role?: 'admin' | 'user'; // Adicionamos a role aqui
  }
}

declare module '@auth/core/jwt' {
  /** O token JWT que é armazenado no cookie da sessão. */
  interface JWT extends NextAuthDefaultJWT {
    profile?: CustomAppProfile;
    role?: 'admin' | 'user'; // E aqui
  }
}
