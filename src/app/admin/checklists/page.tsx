"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { OperatorChecklist } from "@/lib/repositories/types";
import Link from "next/link";

export default function AdminChecklistsPage() {
  const { profile } = useAuth();
  const [checklists, setChecklists] = useState<OperatorChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;

  useEffect(() => {
    if (!tenantId) return;

    const fetchChecklists = async () => {
      try {
        const q = query(
          collection(db, "checklists"),
          where("tenantId", "==", tenantId),
          // orderBy requires an index if mixed with where. For simplicity, we order locally if there's no index.
          // orderBy("createdAt", "desc")
        );
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as OperatorChecklist));
        
        // Sort locally descending
        list.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || new Date(a.fecha).getTime();
          const dateB = b.createdAt?.toMillis?.() || new Date(b.fecha).getTime();
          return dateB - dateA;
        });

        setChecklists(list);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los checklists.");
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [tenantId]);

  if (loading) return <div>Cargando checklists...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Checklists Diarios</h1>
          <p className="text-slate-600 mt-1">Historial de registros operativos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {checklists.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No hay checklists registrados. Los operadores pueden registrar checklists desde el perfil público de cada máquina.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha / Turno</th>
                  <th className="px-6 py-4">Máquina</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Hacienda</th>
                  <th className="px-6 py-4 text-right">Horómetro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checklists.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{c.fecha}</div>
                      <div className="text-xs text-slate-500">{c.turno}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {c.assetId ? (
                        <Link href={`/admin/assets/${c.assetId}`}>{c.maquinaNombre}</Link>
                      ) : (
                        c.maquinaNombre
                      )}
                    </td>
                    <td className="px-6 py-4">{c.operador}</td>
                    <td className="px-6 py-4">{c.hacienda}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                      {c.horaInicio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
