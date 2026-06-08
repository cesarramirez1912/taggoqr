"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard de Empresa</h2>
        <p className="text-slate-500 mt-1">Resumen general de tus activos y mantenimientos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">Activos Registrados</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900">42</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">QRs Sin Asignar</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">15</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">Mantenimientos Hoy</h3>
          <p className="text-3xl font-bold mt-2 text-amber-600">2</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/admin/assets/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
          Registrar Activo Manualmente
        </Link>
        <Link href="/admin/qr" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
          Imprimir Nuevos QRs
        </Link>
      </div>
    </div>
  );
}
