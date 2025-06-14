import { redirect } from 'next/navigation';

// Redireciona para a página de login.
// TODO: Implementar verificação de autenticação aqui.
// Se autenticado, redirecionar para `/dashboard`
// Senão, redirecionar para `/login`
export default function RootPage() {
  redirect(`/login`);
  // Este return null é para satisfazer o TypeScript, pois o redirect interrompe a execução.
  return null; 
}
