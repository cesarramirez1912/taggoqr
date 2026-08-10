"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Tenant } from "@/lib/repositories/types";
import { getIndustryTerms } from "@/lib/utils/industryTerms";

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;
  const isTenantAdmin = tenantId ? profile?.tenantRoles[tenantId] === "admin" : false;

  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (tenantId) {
      getDoc(doc(db, "tenants", tenantId)).then(snap => {
        if (snap.exists()) setTenant(snap.data() as Tenant);
      });
    }
  }, [tenantId]);

  const terms = getIndustryTerms(tenant?.industry);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "editor"]}>
      <div className="flex flex-col md:flex-row flex-1">
        
        {/* Navegación móvil (Tabs) */}
        <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto w-full sticky top-0 z-10 shadow-sm print:hidden">
          <nav className="flex px-4 py-2 space-x-2 min-w-max">
            <Link href="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              Dashboard
            </Link>
            <Link href="/admin/assets" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/assets') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              Mis {terms.assets}
            </Link>
            <Link href="/admin/qr" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/qr') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              Generador de QRs
            </Link>
            <Link href="/admin/checklists" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/checklists') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              {terms.checklists}
            </Link>
            {/* Nuevos accesos módulo comercial */}
            <Link href="/admin/quotes" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/quotes') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              Ventas y Presupuestos
            </Link>
            <Link href="/admin/customers" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/customers') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              Clientes
            </Link>
            <Link href="/admin/catalog" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/catalog') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
              Catálogo
            </Link>
            {isTenantAdmin && (
              <>
                <Link href="/admin/users" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/users') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                  Usuarios
                </Link>
                <Link href="/admin/settings" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/settings') ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                  Ajustes
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar secundario para Admin de Empresa (Desktop) */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block shrink-0 min-h-[calc(100vh-4rem)] print:hidden">
          {tenant && (
            <div className="mb-6 px-4 flex flex-col gap-2">
              {tenant.logoUrl && (
                <img src={tenant.logoUrl} alt="Logo Empresa" className="max-h-12 object-contain object-left" />
              )}
              <span className="font-bold text-slate-800 text-lg leading-tight">{tenant.name}</span>
            </div>
          )}
          <nav className="space-y-2 sticky top-4">
            <Link href="/admin" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Dashboard
            </Link>
            <Link href="/admin/assets" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/assets') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Mis {terms.assets}
            </Link>
            <Link href="/admin/qr" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/qr') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Generador de QRs
            </Link>
            <Link href="/admin/checklists" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/checklists') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              {terms.checklists}
            </Link>
            {/* Nuevos accesos módulo comercial */}
            <Link href="/admin/quotes" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/quotes') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Ventas y Presupuestos
            </Link>
            <Link href="/admin/customers" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/customers') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Clientes
            </Link>
            <Link href="/admin/catalog" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/catalog') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              Catálogo
            </Link>
            {isTenantAdmin && (
              <>
                <Link href="/admin/users" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/users') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Usuarios
                </Link>
                <Link href="/admin/settings" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/admin/settings') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  Ajustes
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 p-4 md:p-8 bg-slate-50 min-w-0 print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
