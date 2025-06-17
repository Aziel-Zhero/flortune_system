
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// Declarações de módulo para estender tipos do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // ID do perfil do Supabase
      profile?: AppProfile | null;
    } & Omit<DefaultSession['user'], 'id'>; // Mantém name, email, image, mas 'id' será o nosso
  }

  interface User {
    id: string; // ID do perfil do Supabase
    name?: string | null;
    email?: string | null;
    image?: string | null;
    profile?: AppProfile | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string; // ID do perfil do Supabase
    profile?: AppProfile | null;
    // Adicionar picture, name, email aqui se quiser que sejam passados diretamente para a session
    picture?: string | null;
    name?: string | null;
    email?: string | null;
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
        console.log("Auth.js: Authorize attempt for email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth.js: Missing email or password");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Busca o perfil na sua tabela public.profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*') // Seleciona todas as colunas, incluindo hashed_password
            .eq('email', email)
            .single();

          if (error || !profile) {
            console.error('Auth.js: Profile not found or Supabase error:', error?.message);
            return null; // Usuário não encontrado
          }

          if (!profile.hashed_password) {
            console.error('Auth.js: User profile does not have a hashed password.');
            return null; // Perfil não tem senha, não pode logar por credenciais
          }
          
          const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

          if (passwordsMatch) {
            console.log("Auth.js: Password match for profile ID:", profile.id);
            // Retorna o objeto User como definido pelo NextAuth.
            // O `id` aqui será o `profile.id` da sua tabela.
            return { 
              id: profile.id, 
              email: profile.email, 
              name: profile.display_name || profile.full_name, 
              image: profile.avatar_url,
              profile: profile as AppProfile // Passando o perfil completo para os callbacks
            };
          } else {
            console.log("Auth.js: Password mismatch for profile ID:", profile.id);
            return null; // Senha não confere
          }
        } catch (e: any) {
          console.error('Auth.js: Exception during authorize:', e.message);
          return null;
        }
      },
    }),
    // Provedor Google será configurado aqui em um passo futuro, se necessário.
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  // adapter: undefined, // Não usando adaptador DB do NextAuth diretamente
  session: {
    strategy: 'jwt', // JWT é recomendado
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) {
      // `user` só está presente no primeiro login.
      // `account` e `oauthProfile` estão presentes para logins OAuth.
      if (user) { // Este `user` é o que foi retornado pelo `authorize` ou pelo provider OAuth
        token.id = user.id; // `user.id` do nosso `authorize` ou do provider OAuth
        if (user.profile) { // Se o `profile` foi anexado em `authorize` (nosso caso para Credentials)
            token.profile = user.profile;
        }
        // Para OAuth, poderíamos mapear `oauthProfile` aqui se necessário,
        // ou lidar com isso no `signIn` callback se quisermos criar/linkar perfis.
        // Por agora, focamos em Credentials.
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // O token JWT (do callback jwt) é usado para popular a sessão.
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token?.profile && session.user) { // Nosso perfil customizado
        session.user.profile = token.profile as AppProfile;
        // Popular campos padrão da sessão com base no perfil, se não já definidos pelo token
        session.user.name = token.name ?? (token.profile as AppProfile).display_name ?? (token.profile as AppProfile).full_name;
        session.user.email = token.email ?? (token.profile as AppProfile).email;
        session.user.image = token.picture ?? (token.profile as AppProfile).avatar_url;
      } else if (session.user) { // Fallback se não houver token.profile, mas houver token.name etc.
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
    // async signIn({ user, account, profile, email, credentials }) {
    //   if (account?.provider === "google") {
    //     // Lógica para criar/linkar usuário na sua tabela `profiles` com dados do Google.
    //     // Ex: const { data, error } = await supabase.from('profiles').upsert({ ... });
    //     // Retornar true para permitir o login, false para negar.
    //   }
    //   return true; // Permitir login por credentials por padrão
    // }
  },
  pages: {
    signIn: '/login',
    // error: '/login', // Opcional: redirecionar para /login em caso de erro
  },
  secret: process.env.AUTH_SECRET, // ESSENCIAL para JWTs!
  // debug: process.env.NODE_ENV === 'development', // Opcional para logs detalhados
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);

    