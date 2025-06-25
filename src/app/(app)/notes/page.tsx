
// src/app/(app)/notes/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is obsolete. Its functionality has been moved to /notepad.
// We redirect to the new page to maintain compatibility with old bookmarks.
export default function ObsoleteNotesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/notepad");
  }, [router]);

  return (
    <div>
      <p>Redirecionando para o Notepad...</p>
    </div>
  );
}
