"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function TenantSettingsPage() {
  const { profile } = useAuth();
  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;

  const [logoUrl, setLogoUrl] = useState("");
  const [haciendasStr, setHaciendasStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      getDoc(doc(db, "tenants", tenantId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setLogoUrl(data.logoUrl || "");
          if (data.haciendas) setHaciendasStr(data.haciendas.join(", "));
        }
        setLoading(false);
      });
    }
  }, [tenantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    try {
      const haciendas = haciendasStr.split(",").map(s => s.trim()).filter(s => s);

      await updateDoc(doc(db, "tenants", tenantId), {
        logoUrl: logoUrl.trim(),
        haciendas
      });
      alert("Ajustes guardados correctamente. Actualiza la página para ver los cambios.");
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Cargando ajustes...</div>;
  if (!tenantId) return <div className="p-8">No tienes permisos.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Ajustes de la Empresa</h2>
      
      <form onSubmit={handleSave} className="space-y-8">
        {/* Logo */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            URL del Logo de la Empresa
          </label>
          <input 
            type="url" 
            placeholder="https://ejemplo.com/mi-logo.png"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            Ingresa un enlace directo a la imagen de tu logo. Se mostrará en el menú lateral.
          </p>
          {logoUrl && (
            <div className="mt-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Vista Previa:</p>
              <img src={logoUrl} alt="Vista previa logo" className="max-h-16 object-contain" />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Configuración de Checklists</h3>
          
          <div className="space-y-6">
            {/* Haciendas */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Haciendas (Separadas por comas)
              </label>
              <textarea 
                rows={2}
                placeholder="Modulo 1, Modulo 2, Estancia Principal..."
                value={haciendasStr}
                onChange={e => setHaciendasStr(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Estas opciones aparecerán en el menú desplegable "Hacienda" cuando el operador llene el checklist.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end border-t border-slate-100">
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Ajustes"}
          </button>
        </div>
      </form>
    </div>
  );
}
