import { redirect } from 'next/navigation';
import {DEFAULT_LOCALE} from '@/config/locales';

// This is the root page for a given locale.
// It redirects to the login page or dashboard based on auth status.
// For now, it always redirects to login for simplicity of regeneration.
export default function RootPage({params}: {params: {locale: string}}) {
  const { locale } = params;
  
  // Validate locale if necessary, though middleware should handle it.
  // For simplicity, we assume locale is valid here.
  
  // TODO: Implement authentication check here.
  // If authenticated, redirect to `/${locale}/dashboard`
  // Else, redirect to `/${locale}/login`

  redirect(`/${locale}/login`);
  
  // This part is unreachable due to the redirect.
  // return null; 
}
