"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Asset, Tenant, UserProfile } from "@/lib/repositories/types";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getUsersForTenant } from "@/app/actions/tenantActions";

export default function OperatorChecklistPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "editor", "operador"]}>
      <OperatorChecklistForm />
    </ProtectedRoute>
  );
}

function OperatorChecklistForm() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Dynamic Options
  const [haciendaOptions, setHaciendaOptions] = useState<string[]>([]);
  const [operadoresList, setOperadoresList] = useState<UserProfile[]>([]);

  // Form State
  const [hacienda, setHacienda] = useState("");
  const [customHacienda, setCustomHacienda] = useState("");
  const [selectedOperadorEmail, setSelectedOperadorEmail] = useState(""); // Solo para Admins
  const [fecha, setFecha] = useState("");
  const [turno, setTurno] = useState<"Mañana" | "Tarde" | "Noche" | "">("");
  const [horaInicio, setHoraInicio] = useState("");

  const isAdminOrEditor = profile?.globalRole === "super_admin" || 
    (profile?.tenantRoles && Object.values(profile.tenantRoles).some(r => r === "admin" || r === "editor"));

  useEffect(() => {
    // Set default date
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setFecha(formattedDate);

    const fetchData = async () => {
      try {
        // 1. Fetch Asset
        const assetRef = doc(db, "assets", assetId);
        const assetSnap = await getDoc(assetRef);
        
        if (!assetSnap.exists()) {
          setError("Activo no encontrado.");
          setLoading(false);
          return;
        }

        const assetData = { ...assetSnap.data(), id: assetSnap.id } as Asset;
        setAsset(assetData);

        // 2. Fetch Tenant (to get dynamic options)
        const tenantRef = doc(db, "tenants", assetData.tenantId);
        const tenantSnap = await getDoc(tenantRef);
        
        if (tenantSnap.exists()) {
          const tenantData = tenantSnap.data() as Tenant;
          setTenant(tenantData);
          setHaciendaOptions(tenantData.haciendas || []);

          // 3. Si es Admin/Editor, traemos la lista de operadores
          if (isAdminOrEditor) {
            const usersRes = await getUsersForTenant(assetData.tenantId);
            if (usersRes.success && usersRes.users) {
              // Filtramos solo los que son operadores
              const ops = usersRes.users.filter((u: any) => u.tenantRoles[assetData.tenantId] === "operador");
              setOperadoresList(ops);
            }
          }
        }

      } catch (err) {
        console.error(err);
        setError("Error al cargar la información.");
      } finally {
        setLoading(false);
      }
    };

    if (profile !== undefined) {
      fetchData();
    }
  }, [assetId, isAdminOrEditor, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !user) return;

    const finalHacienda = hacienda === "Otro" ? customHacienda : hacienda;
    
    // Si es Admin y seleccionó a alguien, usa ese correo. Si no, usa su propio correo.
    let finalOperador = user.email || "Usuario Desconocido";
    if (isAdminOrEditor && selectedOperadorEmail) {
      finalOperador = selectedOperadorEmail;
    }

    if (!finalHacienda || !fecha || !turno || !horaInicio) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    if (isAdminOrEditor && !selectedOperadorEmail) {
      setError("Por favor selecciona el operador responsable.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const checklistData = {
        tenantId: asset.tenantId,
        assetId: asset.id,
        hacienda: finalHacienda,
        operador: finalOperador,
        registradoPorAdmin: isAdminOrEditor ? user.email : null, // Auditoría extra
        maquinaNombre: asset.name || asset.customId,
        fecha,
        turno,
        horaInicio,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "checklists"), checklistData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Error al guardar el registro. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || profile === undefined) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando...</div>;
  if (error && !asset) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">{error}</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Registro Guardado!</h2>
          <p className="text-slate-600 mb-6">El checklist diario se ha enviado correctamente.</p>
          <button 
            onClick={() => router.push(`/a/${assetId}`)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-medium transition-colors"
          >
            Volver a la Máquina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Checklist Diario</h1>
          <p className="text-blue-100 mt-1">Registra las condiciones de operación</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">Sesión iniciada como:</p>
            <p className="font-semibold text-slate-900">{user?.email} {isAdminOrEditor && <span className="text-blue-600 font-medium text-sm ml-2">(Admin/Editor)</span>}</p>
          </div>

          {/* Selector de Operador Solo para Admin */}
          {isAdminOrEditor && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                ¿A nombre de quién es este reporte? *
              </label>
              <select 
                value={selectedOperadorEmail} 
                onChange={(e) => setSelectedOperadorEmail(e.target.value)}
                className="w-full border-blue-200 rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="" disabled>Selecciona el Operador Responsable</option>
                {operadoresList.length === 0 ? (
                  <option value="" disabled>No hay operadores creados en Ajustes</option>
                ) : (
                  operadoresList.map(op => <option key={op.id} value={op.email}>{op.email}</option>)
                )}
              </select>
              <p className="text-xs text-blue-600 mt-2">
                Como Administrador, debes elegir qué operador realizó el trabajo. Si no hay operadores en la lista, ve al Panel de Control -{">"} Usuarios y crea cuentas con rol "Operador".
              </p>
            </div>
          )}

          {/* Máquina (Readonly) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Máquina *</label>
            <input 
              type="text" 
              value={asset?.name || ""} 
              disabled 
              className="w-full border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-slate-500 font-medium"
            />
          </div>

          {/* Hacienda */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hacienda *</label>
            <select 
              value={hacienda} 
              onChange={(e) => setHacienda(e.target.value)}
              className="w-full border-slate-200 rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="" disabled>Seleccionar Hacienda</option>
              {haciendaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              <option value="Otro">Otro...</option>
            </select>
            {hacienda === "Otro" && (
              <input 
                type="text" 
                placeholder="Especificar otra hacienda..." 
                value={customHacienda}
                onChange={(e) => setCustomHacienda(e.target.value)}
                className="mt-2 w-full border-slate-200 rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha *</label>
            <input 
              type="date" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border-slate-200 rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Turno */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Turno *</label>
            <div className="flex gap-4">
              {["Mañana", "Tarde", "Noche"].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="turno" 
                    value={t} 
                    checked={turno === t}
                    onChange={() => setTurno(t as any)}
                    className="text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-slate-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Registro de Horas */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hora de Inicio (Horómetro) *</label>
            <input 
              type="number" 
              step="0.1"
              placeholder="Ej. 1500" 
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full border-slate-200 rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Registrar las horas trabajadas o kilometraje al inicio.</p>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={() => router.push(`/a/${assetId}`)}
              className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
