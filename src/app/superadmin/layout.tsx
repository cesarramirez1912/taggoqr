"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <div className="p-4 md:p-8 flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Panel de Super Admin</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Nivel Global</span>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
