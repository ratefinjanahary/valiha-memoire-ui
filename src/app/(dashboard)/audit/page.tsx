"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/authStore";
// Adapte ce chemin à l'emplacement réel de ton composant
import { AuditLogsTable } from "@/components/dashboard/audit-logs-table";

export default function AuditPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const isAdmin = user?.role === "ADMIN";

  // Non-ADMIN : on quitte la page dès que le store persisté est réhydraté
  useEffect(() => {
    if (hasHydrated && !isAdmin) router.replace("/dashboard");
  }, [hasHydrated, isAdmin, router]);

  // Rien n'est rendu (ni requête API envoyée) tant que le rôle n'est pas confirmé
  if (!hasHydrated || !isAdmin) return null;

  return <AuditLogsTable />;
}