"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NewAssetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrId = searchParams.get("qrId");

  const [formData, setFormData] = useState({
    customId: "",
    name: "",
    type: "machine",
    serialNumber: "",
    location: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí haríamos el insert al assetRepository y actualizaríamos el qrTag
    console.log("Creando activo asociado al QR:", qrId, formData);
    
    // Simular guardado
    alert("¡Activo registrado con éxito!");
    // Redirigir a los activos
    router.push("/admin/assets");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Registrar Nuevo Activo</h2>
      
      {qrId ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <span className="font-medium mr-2">Enlazando con QR:</span>
          <span className="font-mono bg-white px-2 py-1 rounded text-sm">{qrId}</span>
        </div>
      ) : (
        <p className="text-slate-500 mb-6">Completa los datos del activo. Puedes asignarle un QR después.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID Personalizado</label>
            <input 
              required
              type="text" 
              placeholder="Ej. MAQ-001"
              value={formData.customId}
              onChange={e => setFormData({...formData, customId: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Serie</label>
            <input 
              type="text" 
              value={formData.serialNumber}
              onChange={e => setFormData({...formData, serialNumber: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Descripción Corta</label>
          <input 
            required
            type="text" 
            placeholder="Ej. Tractor John Deere 5000"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Activo</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="machine">Máquina</option>
              <option value="vehicle">Vehículo</option>
              <option value="tool">Herramienta / Equipo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
            <input 
              type="text" 
              placeholder="Ej. Sector A, Finca Sur"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
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
            Guardar Activo
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewAssetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando formulario...</div>}>
      <NewAssetForm />
    </Suspense>
  );
}
