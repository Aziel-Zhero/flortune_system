
// Este arquivo já foi incorporado/duplicado dentro de src/app/api/auth/[...nextauth]/route.ts
// para manter a tipagem junto com a configuração.
// No entanto, é boa prática mantê-lo separado.
// As declarações de módulo abaixo estendem os tipos padrão do NextAuth.

import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from '@auth/core/jwt';
import type { Profile as AppProfile } from '@/types/database.types'; // Seu tipo de perfil

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      profile?: AppProfile | null; 
    } & DefaultSession['user']; // Mantém name, email, image da DefaultSession
    // supabaseAccessToken?: string; // Se você fosse integrar RLS com Supabase diretamente
  }

  interface User extends DefaultUser {
    // Adicione propriedades customizadas ao objeto User que é retornado pelo `authorize`
    // e passado para os callbacks `jwt` e `session`.
    profile?: AppProfile | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends DefaultJWT {
    // Adicione propriedades customizadas ao token JWT
    id?: string; // ID do usuário
    profile?: AppProfile | null;
  }
}
