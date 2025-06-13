import { redirect } from 'next/navigation';

export default function HomePage({params: {locale}}: {params: {locale: string}}) {
  // For now, always redirect to login.
  // Later, this can check auth state and redirect to /dashboard if logged in.
  redirect(`/${locale}/login`);
  return null;
}
