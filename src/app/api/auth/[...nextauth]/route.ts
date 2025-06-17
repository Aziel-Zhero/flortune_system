
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase/client'; // Usaremos para buscar usuário
import bcrypt from 'bcryptjs';
import type { Profile } from '@/types/database.types'; // Importar o tipo Profile

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // Adicione quaisquer outros campos que você deseja na sessão
      profile?: Profile | null; // Para armazenar o perfil completo
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    profile?: Profile | null; // Para passar o perfil ao callback jwt/session
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    profile?: Profile | null;
  }
}


export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'nome@exemplo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("Auth.js: Authorize attempt for email:", credentials.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth.js: Missing email or password");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

          if (error || !profile) {
            console.error('Auth.js: Profile not found or Supabase error:', error?.message);
            return null;
          }

          if (!profile.hashed_password) {
            console.error('Auth.js: User profile does not have a hashed password. Cannot authenticate with credentials.');
            return null;
          }
          
          const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

          if (passwordsMatch) {
            console.log("Auth.js: Password match for user:", profile.id);
            // Retornar o objeto User como definido pelo NextAuth
            // Incluindo o perfil completo para que possa ser usado nos callbacks
            return { 
              id: profile.id, 
              email: profile.email, 
              name: profile.display_name || profile.full_name, 
              image: profile.avatar_url,
              profile: profile as Profile // Passando o perfil completo
            };
          } else {
            console.log("Auth.js: Password mismatch for user:", profile.id);
            return null;
          }
        } catch (e) {
          console.error('Auth.js: Exception during authorize:', e);
          return null;
        }
      },
    }),
    // Google provider será adicionado aqui em um passo futuro
  ],
  adapter: undefined, // Não estamos usando um adaptador de banco de dados do NextAuth diretamente, gerenciamos via Supabase
  session: {
    strategy: 'jwt', // Usar JWTs para sessão
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // console.log("Auth.js Callback JWT: User:", user);
      // console.log("Auth.js Callback JWT: Token before:", token);
      if (user) { // Na primeira vez (login), o objeto `user` (retornado pelo `authorize`) está disponível
        token.id = user.id;
        if (user.profile) { // Se o perfil foi anexado ao usuário em authorize
            token.profile = user.profile;
        }
      }
      // console.log("Auth.js Callback JWT: Token after:", token);
      return token;
    },
    async session({ session, token }) {
      // console.log("Auth.js Callback Session: Token:", token);
      // console.log("Auth.js Callback Session: Session before:", session);
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token?.profile && session.user) {
        session.user.profile = token.profile as Profile;
        // Adicionalmente, popular campos padrão da sessão se desejado
        session.user.name = (token.profile as Profile).display_name || (token.profile as Profile).full_name;
        session.user.email = (token.profile as Profile).email;
        session.user.image = (token.profile as Profile).avatar_url;
      }
      // console.log("Auth.js Callback Session: Session after:", session);
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout', // Opcional
    // error: '/auth/error', // Opcional
    // verifyRequest: '/auth/verify-request', // Opcional, para email provider
    // newUser: null // Redireciona para / após signup se null ou não definido
  },
  // Adicionar um AUTH_SECRET é crucial para produção e JWTs
  secret: process.env.AUTH_SECRET,
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
