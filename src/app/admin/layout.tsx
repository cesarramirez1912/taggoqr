"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "editor"]}>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar secundario para Admin de Empresa */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block">
          <nav className="space-y-2">
            <Link href="/admin" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Dashboard
            </Link>
            <Link href="/admin/assets" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/assets') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Mis Activos
            </Link>
            <Link href="/admin/qr" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/qr') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Generador de QRs
            </Link>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
