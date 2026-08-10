"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Asset, Tenant } from "@/lib/repositories/types";
import { getIndustryTerms } from "@/lib/utils/industryTerms";

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const assetId = params.assetId as string;

  const [formData, setFormData] = useState({
    customId: "",
    name: "",
    type: "machine" as Asset["type"],
    serialNumber: "",
    location: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vinOrChassis: "",
    usageMetrics: "",
    nextMaintenanceDate: "",
    status: "active" as Asset["status"],
    licensePlate: "",
    customerName: "",
    customerPhone: "",
    qrTagId: "",
  });
  
  const [newQrTagId, setNewQrTagId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const terms = getIndustryTerms(tenant?.industry);

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
          setError("No tienes permiso para editar este activo.");
          setLoading(false);
          return;
        }

        setFormData({
          customId: data.customId || "",
          name: data.name || "",
          type: data.type || "machine",
          serialNumber: data.serialNumber || "",
          location: data.location || "",
          brand: data.brand || "",
          model: data.model || "",
          year: data.year || new Date().getFullYear(),
          vinOrChassis: data.vinOrChassis || "",
          usageMetrics: data.usageMetrics || "",
          nextMaintenanceDate: data.nextMaintenanceDate || "",
          status: data.status || "active",
          licensePlate: data.licensePlate || "",
          customerName: data.customerName || "",
          customerPhone: data.customerPhone || "",
          qrTagId: data.qrTagId || "",
        });

        // Get tenant to determine industry
        const tenantSnap = await getDoc(doc(db, "tenants", data.tenantId));
        if (tenantSnap.exists()) {
          setTenant(tenantSnap.data() as Tenant);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    if (profile) fetchAsset();
  }, [assetId, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    setSaving(true);
    setError("");

    try {
      let finalQrTagId = formData.qrTagId;
      if (newQrTagId && newQrTagId !== formData.qrTagId) {
        // Enlazar nuevo QR
        await updateDoc(doc(db, "qrTags", newQrTagId), {
          assetId: assetId,
          status: "assigned"
        });
        
        // Liberar QR viejo si tenía
        if (formData.qrTagId) {
          try {
            await updateDoc(doc(db, "qrTags", formData.qrTagId), {
              assetId: null,
              status: "printed"
            });
          } catch (e) {
            console.warn("No se pudo liberar el QR anterior", e);
          }
        }
        finalQrTagId = newQrTagId;
      }

      const docRef = doc(db, "assets", assetId as string);
      await updateDoc(docRef, {
        customId: formData.customId,
        name: formData.name,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        vinOrChassis: formData.vinOrChassis,
        usageMetrics: formData.usageMetrics,
        nextMaintenanceDate: formData.nextMaintenanceDate,
        serialNumber: formData.serialNumber,
        location: formData.location,
        status: formData.status,
        licensePlate: formData.licensePlate,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        qrTagId: finalQrTagId,
        updatedBy: profile?.id,
        updatedAt: new Date(),
      });

      router.push(`/a/${assetId}`);
    } catch (err: any) {
      console.error(err);
      setError("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando datos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">← Volver</button>
        <h2 className="text-2xl font-bold text-slate-900">Editar {terms.asset}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECCIÓN 1: Identificación Básica */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Identificación Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Descripción Corta *</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Personalizado</label>
              <input 
                type="text" 
                value={formData.customId}
                onChange={e => setFormData({...formData, customId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de {terms.asset}</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as Asset["type"]})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="vehicle">Vehículo</option>
                <option value="machine">Máquina / Pesada</option>
                <option value="tool">Herramienta / Equipo Pequeño</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación / Sector</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as Asset["status"]})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">Operativo</option>
                <option value="maintenance">En Mantenimiento</option>
                <option value="inactive">Inactivo / Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Datos Específicos (Cliente / Patente) si aplica */}
        {(terms.hasCustomer || terms.hasLicensePlate) && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Datos del {terms.hasCustomer ? "Cliente y Vehículo" : "Vehículo"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {terms.hasCustomer && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente / Dueño</label>
                    <input 
                      type="text" 
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono del Cliente</label>
                    <input 
                      type="text" 
                      value={formData.customerPhone}
                      onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}
              {terms.hasLicensePlate && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa / Patente *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.licensePlate}
                    onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 3: Datos Técnicos */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Datos Técnicos ({terms.asset})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <input 
                type="text" 
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
              <input 
                type="number" 
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VIN / N° de Chasis</label>
              <input 
                type="text" 
                value={formData.vinOrChassis}
                onChange={e => setFormData({...formData, vinOrChassis: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">N° de Serie Motor</label>
              <input 
                type="text" 
                value={formData.serialNumber}
                onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Uso y Mantenimiento */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Uso y Mantenimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kilómetros / Horas de Uso</label>
              <input 
                type="text" 
                value={formData.usageMetrics}
                onChange={e => setFormData({...formData, usageMetrics: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Sugerencia: Usa el registro de mantenimiento para actualizar esto automáticamente.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Próximo Mantenimiento</label>
              <input 
                type="date" 
                value={formData.nextMaintenanceDate}
                onChange={e => setFormData({...formData, nextMaintenanceDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Código QR */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Código QR</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vincular nuevo Código QR (Dejar en blanco para mantener el actual)</label>
            <input 
              type="text" 
              placeholder="Ej. qr_123456"
              value={newQrTagId}
              onChange={e => setNewQrTagId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
            {formData.qrTagId && !newQrTagId && (
              <p className="text-xs text-slate-500 mt-2">QR Actual: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{formData.qrTagId}</span></p>
            )}
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
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
