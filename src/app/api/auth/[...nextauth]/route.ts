// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js'; 
import bcrypt from 'bcryptjs';

// Validação básica
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nextAuthSecret = process.env.AUTH_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey || !nextAuthSecret) {
  throw new Error('Variáveis de ambiente faltando');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Tentando login para:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Credenciais incompletas');
            return null;
          }

          // Busca o usuário
          const { data: user, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', credentials.email.toLowerCase().trim())
            .single();

          if (error || !user) {
            console.log('❌ Usuário não encontrado:', error?.message);
            return null;
          }

          console.log('👤 Usuário encontrado:', user.email);

          // Verifica senha
          if (!user.hashed_password) {
            console.log('❌ Usuário não tem senha');
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password, 
            user.hashed_password
          );

          if (!isValidPassword) {
            console.log('❌ Senha incorreta');
            return null;
          }

          console.log('✅ Login válido para:', user.email);
          
          return {
            id: user.id,
            email: user.email,
            name: user.display_name || user.full_name,
            image: user.avatar_url,
          };
        } catch (error) {
          console.error('❌ Erro no authorize:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authOptions as any);
