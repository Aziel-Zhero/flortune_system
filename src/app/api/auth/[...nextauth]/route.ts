
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client'; // Nosso cliente Supabase normal (usa anon key)
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types'; // Nossa tabela public.profiles

// Checagens de variáveis de ambiente essenciais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseServiceRoleKey) {
  throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
}
if (!nextAuthSecret) {
  console.warn("Missing environment variable: AUTH_SECRET. NextAuth.js will not work securely in production.");
  // throw new Error("Missing environment variable: AUTH_SECRET"); // Pode ser muito estrito para dev
}
// supabaseJwtSecret é opcional para a geração do supabaseAccessToken, mas bom ter.


export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("[NextAuth Authorize Attempt] Email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth Authorize Failed] Missing email or password.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Usar o cliente Supabase com service_role para buscar o perfil,
          // ou garantir que RLS permita a leitura pela 'anon' key se usar o cliente global.
          // Para segurança, é melhor um cliente específico se a RLS for restritiva.
          // No entanto, a action de login já é server-side, o cliente global deve funcionar se RLS permitir anon select.
          // Mas, para ser mais robusto e independente das RLS de `public.profiles` para o processo de auth em si:
          // const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey); // Se necessário
          
          console.log(`[NextAuth Authorize] Fetching profile from public.profiles for email: ${email}`);
          const { data: profile, error: dbError } = await supabase // Usando o cliente global por enquanto
            .from('profiles')
            .select('*') // Seleciona tudo de public.profiles
            .eq('email', email)
            .single();

          if (dbError || !profile) {
            console.error('[NextAuth Authorize Failed] Supabase DB error or profile not found:', dbError?.message);
            return null;
          }

          console.log(`[NextAuth Authorize] Profile found for ID: ${profile.id}. Checking password.`);
          if (!profile.hashed_password) {
            console.error(`[NextAuth Authorize Failed] User profile (ID: ${profile.id}) does not have a hashed password.`);
            return null;
          }
          
          const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

          if (passwordsMatch) {
            console.log(`[NextAuth Authorize Success] Password match for profile ID: ${profile.id}.`);
            // O adapter espera um objeto com id, email, name, image.
            // Retornamos o 'id' da nossa tabela 'profiles'.
            // O adapter irá então criar/linkar uma entrada em 'next_auth.users' com este 'id'.
            return {
              id: profile.id, // Este ID será usado pelo adapter para next_auth.users.id
              email: profile.email,
              name: profile.display_name || profile.full_name,
              image: profile.avatar_url,
              // Não passar o profile inteiro aqui, pois o adapter só usa os campos padrão.
              // O perfil completo será carregado no callback de sessão.
            };
          } else {
            console.log(`[NextAuth Authorize Failed] Password mismatch for profile ID: ${profile.id}.`);
            return null;
          }
        } catch (e: any) {
          console.error('[NextAuth Authorize Exception]:', e.message, e.stack);
          return null;
        }
      },
    }),
    // Outros providers (Google, etc.) podem ser adicionados aqui. O adapter cuidará deles.
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // `user` só está presente no primeiro login.
      // O SupabaseAdapter já deve estar populando o `token.sub` com o `user.id`.
      if (user?.id) {
        token.sub = user.id; // Garante que o subject do token é o nosso ID de usuário.
      }
      return token;
    },
    async session({ session, token }) {
      // `token.sub` deve conter o user.id (que é o public.profiles.id)
      if (token.sub && session.user) {
        session.user.id = token.sub;

        // Buscar o perfil customizado de public.profiles
        // Esta operação deve ser feita com uma chave que tenha permissão (service_role ou RLS adequada)
        // Como estamos no backend (API route), podemos usar o service_role para segurança.
        // No entanto, o cliente global do supabase já está instanciado.
        // Se RLS for um problema, criar um cliente admin aqui.
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', token.sub)
          .single();

        if (profileError) {
          console.error("Error fetching user profile in session callback:", profileError.message);
          session.user.profile = null;
        } else if (userProfile) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForSession } = userProfile;
          session.user.profile = profileForSession as Omit<AppProfile, 'hashed_password'>;
          // Atualiza os campos padrão da sessão com dados do perfil, se disponíveis e mais completos
          session.user.name = userProfile.display_name || userProfile.full_name || session.user.name;
          session.user.email = userProfile.email || session.user.email;
          session.user.image = userProfile.avatar_url || session.user.image;
        }
      }

      // Gerar supabaseAccessToken conforme a documentação do adapter
      if (supabaseJwtSecret && token.sub && token.email) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub, // user.id
          email: token.email,
          role: "authenticated", 
          // Você pode adicionar app_metadata ou user_metadata aqui se necessário
        };
        session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
      } else if (!supabaseJwtSecret) {
        console.warn("SUPABASE_JWT_SECRET is not set. supabaseAccessToken will not be generated.");
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
