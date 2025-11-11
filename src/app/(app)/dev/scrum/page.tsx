// src/app/(app)/dev/scrum/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been deprecated and its link removed from the menu.
// The focus has shifted to Kanban tools.
// We redirect to the Kanban board as a sensible default.
export default function ObsoleteScrumPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dev/kanban");
  }, [router]);

  return (
    <div>
      <p>Redirecionando para o Quadro Kanban...</p>
    </div>
  );
}
