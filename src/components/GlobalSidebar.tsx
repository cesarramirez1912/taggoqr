"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";

export function GlobalSidebar() {
  const { user, profile, loading } = useAuth();
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || "tu@correo.com";
  
  if (loading || !user) return null;

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL || profile?.globalRole === "super_admin";

  // Si no es Super Admin, ocultamos por completo esta barra oscura (usarán la barra blanca de /admin)
  if (!isSuperAdmin) return null;

  return (
    <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col print:hidden">
      <h1 className="text-xl font-bold mb-8 tracking-tight text-white/90">TaggoQR</h1>
      <nav className="flex flex-col space-y-4">
        <Link href="/superadmin" className="hover:text-purple-400 transition-colors font-medium">Panel Super Admin</Link>
        <div className="pt-4 mt-4 border-t border-slate-700"></div>
        <Link href="/admin" className="hover:text-blue-400 transition-colors font-medium">Dashboard Empresa (Modo Admin)</Link>
      </nav>
    </aside>
  );
}
