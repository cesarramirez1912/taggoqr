"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NewMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.assetId as string;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Mantenimiento Preventivo",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registrando mantenimiento para", assetId, formData);
    alert("Mantenimiento registrado");
    // Redirigir de vuelta al perfil del activo
    router.push(`/a/${assetId}`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Registrar Mantenimiento</h2>
      <p className="text-slate-500 mb-6">Añade un nuevo registro al historial de este activo.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input 
              required
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Tarea</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option>Mantenimiento Preventivo</option>
              <option>Mantenimiento Correctivo</option>
              <option>Cambio de Aceite</option>
              <option>Revisión Técnica</option>
              <option>Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de las tareas realizadas</label>
          <textarea 
            required
            rows={4}
            placeholder="Ej. Se reemplazó el filtro de aceite y se ajustaron las correas."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Guardar Registro
          </button>
        </div>
      </form>
    </div>
  );
}
