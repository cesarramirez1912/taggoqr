"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { Asset } from "@/lib/repositories/types";
import Link from "next/link";

export default function LinkQRPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  
  // En vez de useParams, qrId viene por query string desde /q/[qrId]
  const [qrId, setQrId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Extraer qrId de la URL (querystring)
    const urlParams = new URLSearchParams(window.location.search);
    const qId = urlParams.get("qrId");
    if (qId) setQrId(qId);

    const fetchAssets = async () => {
      if (!profile || !profile.tenantRoles) return;
      const tenantId = Object.keys(profile.tenantRoles)[0];
      if (!tenantId) return;

      try {
        // Solo traer activos que NO tengan un QR ya asignado (o que queramos sobreescribir)
        // Por simplicidad, traemos todos y podemos filtrar los que qrTagId == ""
        const q = query(collection(db, "assets"), where("tenantId", "==", tenantId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Asset));
        setAssets(list);
      } catch (e) {
        console.error(e);
        setError("Error al cargar los activos.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [profile]);

  const handleLink = async (assetId: string) => {
    if (!qrId) return;
    setSaving(true);
    try {
      // 1. Actualizar el QR
      await updateDoc(doc(db, "qrTags", qrId), {
        assetId: assetId,
        status: "assigned"
      });
      // 2. Actualizar el Activo para que sepa qué QR tiene
      await updateDoc(doc(db, "assets", assetId), {
        qrTagId: qrId
      });

      alert("QR enlazado exitosamente!");
      router.push(`/a/${assetId}`);
    } catch (e) {
      console.error(e);
      alert("Error al enlazar.");
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Vincular Código QR a Activo Existente</h2>
        <p className="text-slate-500 mt-1">Estás a punto de enlazar el QR físico <strong>{qrId}</strong> a una máquina de tu inventario.</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">{error}</div>}

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700">Selecciona el Activo:</h3>
        {assets.length === 0 ? (
          <p className="text-slate-500">No tienes activos registrados. Deberías crear uno nuevo primero.</p>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {assets.map(asset => (
              <li key={asset.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">{asset.name}</p>
                  <p className="text-sm text-slate-500">ID: {asset.customId} • {asset.brand} {asset.model}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/a/${asset.id}`} className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm">Ver Perfil</Link>
                  <button 
                    onClick={() => handleLink(asset.id)}
                    disabled={saving}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    {saving ? "Enlazando..." : "Enlazar a este QR"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 font-medium">
          Cancelar y Volver
        </button>
      </div>
    </div>
  );
}
