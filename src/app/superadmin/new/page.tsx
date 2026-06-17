"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTenantWithAdmin } from "@/app/actions/tenantActions";

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createTenantWithAdmin({
      tenantName: name,
      adminEmail: email,
      adminPassword: password,
    });

    setLoading(false);

    if (result.success) {
      alert(`Empresa "${name}" y usuario creados exitosamente.`);
      router.push("/superadmin");
    } else {
      setError(result.error || "Error desconocido");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          ← Volver
        </button>
        <h3 className="text-xl font-bold">Dar de Alta Empresa</h3>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
            <input 
              required
              type="text" 
              placeholder="Ej. Logística Global SA"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario, Número Único o Email del Administrador</label>
            <input 
              required
              type="text" 
              placeholder="Ej: gerente_agricola o admin@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Inicial</label>
            <input 
              required
              type="text" 
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              {loading ? "Creando..." : "Crear Empresa y Administrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
