import { redirect } from 'next/navigation';

export default function HomePage({params}: {params: {locale: string}}) { // Pass full params
  const { locale } = params; // Destructure inside
  // For now, always redirect to login.
  // Later, this can check auth state and redirect to /dashboard if logged in.
  redirect(`/${locale}/login`); // Use the resolved locale for redirect
  // return null; // This will be unreachable due to redirect
}
