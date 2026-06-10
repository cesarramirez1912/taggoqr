"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, doc as firestoreDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Asset, Maintenance } from "@/lib/repositories/types";

export default function NewMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Preventivo",
    description: "",
    cost: "",
    currency: "USD",
    newUsageMetrics: "",
    nextMaintenanceDate: "",
    newStatus: "active" as Asset["status"]
  });

  useEffect(() => {
    const fetchAsset = async () => {
      if (!assetId) {
        setError("ID no proporcionado");
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "assets", assetId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError("Activo no encontrado.");
          setLoading(false);
          return;
        }

        const data = docSnap.data() as Asset;
        
        // Verificar permisos
        if (!profile || !profile.tenantRoles || !profile.tenantRoles[data.tenantId]) {
          setError("No tienes permiso para gestionar este activo.");
          setLoading(false);
          return;
        }

        setAsset(data);
        
        // Pre-rellenar con datos actuales del activo para facilitar la actualización
        setFormData(prev => ({
          ...prev,
          newUsageMetrics: data.usageMetrics || "",
          nextMaintenanceDate: data.nextMaintenanceDate || "",
          newStatus: data.status || "active"
        }));

      } catch (err: any) {
        console.error(err);
        setError("Error al cargar el activo.");
      } finally {
        setLoading(false);
      }
    };

    if (profile) fetchAsset();
  }, [assetId, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !profile) return;
    
    setSaving(true);
    setError("");

    try {
      const tenantId = Object.keys(profile.tenantRoles)[0];
      const batch = writeBatch(db);

      // 1. Crear documento de mantenimiento
      const maintRef = firestoreDoc(collection(db, "maintenances"));
      const newMaintenance: Omit<Maintenance, "id"> = {
        tenantId,
        assetId: assetId as string,
        date: formData.date,
        type: formData.type,
        description: formData.description,
        cost: formData.cost ? Number(formData.cost) : undefined,
        currency: formData.cost ? formData.currency : undefined,
        usageMetricsSnapshot: formData.newUsageMetrics,
        photos: [],
        createdAt: new Date(),
        createdBy: profile.id,
      };
      batch.set(maintRef, newMaintenance);

      // 2. Actualizar el activo principal
      const assetRef = doc(db, "assets", assetId as string);
      batch.update(assetRef, {
        usageMetrics: formData.newUsageMetrics,
        nextMaintenanceDate: formData.nextMaintenanceDate,
        status: formData.newStatus,
        updatedBy: profile.id,
        updatedAt: new Date()
      });

      await batch.commit();

      router.push(`/a/${assetId}`);
    } catch (err: any) {
      console.error(err);
      setError("Error al guardar el mantenimiento.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando datos...</div>;
  if (error || !asset) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">← Volver</button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registrar Mantenimiento</h2>
          <p className="text-slate-500">Para: {asset.name} ({asset.customId})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Impacto Doble:</strong> Al guardar este registro, el historial del equipo quedará grabado y 
            <strong> sus kilómetros/horas y estado general se actualizarán automáticamente.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Trabajo *</label>
            <input 
              required
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Mantenimiento</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Preventivo">Preventivo (Cambio de aceite, filtros, rutinas)</option>
              <option value="Correctivo">Correctivo (Reparación de fallas/roturas)</option>
              <option value="Predictivo">Predictivo (Análisis, sensores)</option>
              <option value="Inspección">Inspección General</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Trabajo Realizado *</label>
          <textarea 
            required
            rows={4}
            placeholder="Detalla los repuestos cambiados, problemas encontrados, etc."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total (Opcional)</label>
            <div className="flex gap-2">
              <select 
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="PYG">Gs.</option>
                <option value="USD">U$D</option>
                <option value="BRL">R$</option>
                <option value="ARS">AR$</option>
              </select>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Uso Actualizado (Km / Hs)</label>
            <input 
              type="text" 
              placeholder="Ej. 15500 km"
              value={formData.newUsageMetrics}
              onChange={e => setFormData({...formData, newUsageMetrics: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo Estado del Activo</label>
            <select 
              value={formData.newStatus}
              onChange={e => setFormData({...formData, newStatus: e.target.value as Asset["status"]})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="active">Operativo (Listo para usar)</option>
              <option value="maintenance">Sigue en Mantenimiento</option>
              <option value="inactive">Inactivo / Baja</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Próximo Mantenimiento Recomendado</label>
            <input 
              type="date" 
              value={formData.nextMaintenanceDate}
              onChange={e => setFormData({...formData, nextMaintenanceDate: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            {saving ? "Guardando..." : "Guardar Mantenimiento"}
          </button>
        </div>
      </form>
    </div>
  );
}
