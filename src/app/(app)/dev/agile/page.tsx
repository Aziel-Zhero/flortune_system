// src/app/(app)/dev/agile/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is obsolete and its route is no longer in the menu.
// We redirect to the /dev/scrum page as a sensible default.
export default function ObsoleteAgilePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dev/scrum");
  }, [router]);

  return (
    <div>
      <p>Redirecionando...</p>
    </div>
  );
}
