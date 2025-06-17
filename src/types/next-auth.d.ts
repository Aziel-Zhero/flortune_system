
import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from '@auth/core/jwt';
import type { Profile as AppProfile } from '@/types/database.types'; // Seu tipo de perfil do banco

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string; // Nosso ID do usuário da tabela profiles
      profile?: Omit<AppProfile, 'hashed_password'> | null; // Perfil sem a senha hasheada
    } & Omit<DefaultSession['user'], 'id'>; // Mantém name, email, image, mas nosso 'id' sobrescreve
  }

  // O objeto User é o que a função `authorize` retorna e o que é passado para os callbacks `jwt` e `session`.
  interface User extends DefaultUser {
    profile?: Omit<AppProfile, 'hashed_password'> | null; // Perfil sem a senha hasheada
    // id já é esperado pelo NextAuth.js como string, nosso profiles.id é UUID (string)
  }
}

declare module '@auth/core/jwt' {
  // O token JWT que é armazenado no cookie da sessão.
  interface JWT extends DefaultJWT {
    id?: string; // Nosso ID do usuário
    profile?: Omit<AppProfile, 'hashed_password'> | null; // Perfil sem a senha hasheada
    // picture, name, email já são campos padrão no JWT se vierem do provider OAuth ou do User object.
    // Adicionamos aqui para garantir que nosso `token.profile` seja o tipo correto.
  }
}
