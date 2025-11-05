// src/app/(app)/forms/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been moved to the admin section.
// We redirect to maintain clean routing.
export default function ObsoleteFormsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div>
      <p>Redirecionando...</p>
    </div>
  );
}
