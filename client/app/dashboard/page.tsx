"use client";

import { RequireAuth } from "@/components/providers/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { RepoDashboard } from "@/components/dashboard/repo-dashboard";

export default function RepositoriesPage() {
  return (
    <RequireAuth>
      <AppShell
        title="Repositories"
        description="Browse and manage your GitHub repositories"
      >
        <RepoDashboard />
      </AppShell>
    </RequireAuth>
  );
}