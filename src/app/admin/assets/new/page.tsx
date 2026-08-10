"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Asset, Tenant } from "@/lib/repositories/types";
import { getIndustryTerms } from "@/lib/utils/industryTerms";

function NewAssetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const qrId = searchParams.get("qrId");

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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useState(() => {
    // Fetch tenant on mount to know the industry
    if (profile && profile.tenantRoles) {
      const tenantId = Object.keys(profile.tenantRoles)[0];
      if (tenantId) {
        getDoc(doc(db, "tenants", tenantId)).then(snap => {
          if (snap.exists()) setTenant(snap.data() as Tenant);
        });
      }
    }
  });

  const terms = getIndustryTerms(tenant?.industry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!profile || !profile.tenantRoles) {
        throw new Error("No tienes una empresa asignada.");
      }

      const tenantId = Object.keys(profile.tenantRoles)[0];
      if (!tenantId) throw new Error("No se pudo determinar tu empresa.");

      // Generar ID si está vacío
      let finalCustomId = formData.customId.trim();
      if (!finalCustomId) {
        finalCustomId = `ACT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      const newAsset: Omit<Asset, "id"> = {
        tenantId,
        qrTagId: qrId || "",
        customId: finalCustomId,
        name: formData.name,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        vinOrChassis: formData.vinOrChassis,
        usageMetrics: formData.usageMetrics,
        nextMaintenanceDate: formData.nextMaintenanceDate,
        qrCodeUrl: "", // Lo enlazaremos luego o lo gestionaremos mediante el QRTag
        serialNumber: formData.serialNumber,
        location: formData.location,
        status: formData.status,
        licensePlate: formData.licensePlate,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        createdAt: new Date(),
        createdBy: profile.id,
      };

      const docRef = await addDoc(collection(db, "assets"), newAsset);

      // Si venía desde un escaneo de QR vacío, hay que enlazar el QR a este activo
      if (qrId) {
        await updateDoc(doc(db, "qrTags", qrId), {
          assetId: docRef.id,
          status: "assigned"
        });
      }

      alert("¡Activo registrado con éxito!");
      router.push("/admin/assets");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar el activo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Registrar Nuevo {terms.asset}</h2>
      
      {qrId ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <span className="font-medium mr-2">Enlazando con QR:</span>
          <span className="font-mono bg-white px-2 py-1 rounded text-sm">{qrId}</span>
        </div>
      ) : (
        <p className="text-slate-500 mb-6">Completa los datos del {terms.asset.toLowerCase()}. Puedes asignarle un código QR después.</p>
      )}

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

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
                placeholder="Ej. Tractor John Deere 5000"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Personalizado (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. MAQ-001 (Se generará solo si está vacío)"
                value={formData.customId}
                onChange={e => setFormData({...formData, customId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
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
                placeholder="Ej. Sector A, Finca Sur"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
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
                      placeholder="Ej. Juan Pérez"
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono del Cliente</label>
                    <input 
                      type="text" 
                      placeholder="Ej. +595 981..."
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
                    placeholder="Ej. ABC 123"
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
                placeholder="Ej. John Deere, Toyota"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
              <input 
                type="text" 
                placeholder="Ej. 5075E"
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
                placeholder="Opcional"
                value={formData.vinOrChassis}
                onChange={e => setFormData({...formData, vinOrChassis: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">N° de Serie Motor / Fabricante</label>
              <input 
                type="text" 
                placeholder="Opcional"
                value={formData.serialNumber}
                onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Mantenimiento y Estado */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Mantenimiento y Estado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kilómetros / Horas de Uso actuales</label>
              <input 
                type="text" 
                placeholder="Ej. 15000 km ó 450 horas"
                value={formData.usageMetrics}
                onChange={e => setFormData({...formData, usageMetrics: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
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

        <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            {loading ? "Guardando..." : `Guardar ${terms.asset}`}
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
