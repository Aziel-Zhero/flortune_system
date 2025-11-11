import type { DefaultSession, User as NextAuthDefaultUser } from 'next-auth';
import type { JWT as NextAuthDefaultJWT } from "@auth/core/jwt";
import type { Profile as CustomAppProfile } from '@/types/database.types';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    supabaseAccessToken?: string;
    user: {
      id: string;
      profile?: Omit<CustomAppProfile, 'hashed_password'> | null;
    } & Omit<DefaultSession['user'], 'id'>;
  }

  interface User extends NextAuthDefaultUser {
    profile?: Omit<CustomAppProfile, 'hashed_password'> | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends NextAuthDefaultJWT {
    profile?: Omit<CustomAppProfile, 'hashed_password'> | null;
  }
}
