// src/app/(admin)/login-admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is obsolete and its route is no longer in the menu.
// The focus has shifted to a unified login page.
// We redirect to the main login page as a sensible default.
export default function ObsoleteAdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div>
      <p>Redirecionando para a página de login...</p>
    </div>
  );
}
