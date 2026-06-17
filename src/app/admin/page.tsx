"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { Asset, Maintenance, QRTag } from "@/lib/repositories/types";

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    maintenanceAssets: 0,
    unassignedQRs: 0,
  });
  
  const [recentMaintenances, setRecentMaintenances] = useState<(Maintenance & { assetName?: string })[]>([]);

  useEffect(() => {
    if (!profile) return;
    
    if (!profile.tenantRoles || Object.keys(profile.tenantRoles).length === 0) {
      setLoading(false);
      return;
    }

    const tenantId = Object.keys(profile.tenantRoles)[0];
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // 1. Activos
        const assetsQuery = query(collection(db, "assets"), where("tenantId", "==", tenantId));
        const assetsSnap = await getDocs(assetsQuery);
        const assetsList = assetsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Asset));
        
        let active = 0;
        let inMaint = 0;
        assetsList.forEach(a => {
          if (a.status === 'active') active++;
          if (a.status === 'maintenance') inMaint++;
        });

        // 2. QRs sin asignar
        const qrsQuery = query(collection(db, "qrTags"), where("tenantId", "==", tenantId), where("status", "==", "printed"));
        const qrsSnap = await getDocs(qrsQuery);
        
        // 3. Mantenimientos recientes
        // En Firestore, sin índice compuesto puede fallar el orderBy. Lo haremos localmente si no hay índice.
        const maintQuery = query(collection(db, "maintenances"), where("tenantId", "==", tenantId));
        const maintSnap = await getDocs(maintQuery);
        const maintList = maintSnap.docs.map(d => ({ ...d.data(), id: d.id } as Maintenance));
        
        maintList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const top5 = maintList.slice(0, 5);

        // Mapear nombres de activos a los mantenimientos
        const enrichedMaintenances = top5.map(m => {
          const asset = assetsList.find(a => a.id === m.assetId);
          return {
            ...m,
            assetName: asset ? asset.name : "Activo Desconocido"
          };
        });

        setStats({
          totalAssets: assetsList.length,
          activeAssets: active,
          maintenanceAssets: inMaint,
          unassignedQRs: qrsSnap.size,
        });

        setRecentMaintenances(enrichedMaintenances);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando métricas del panel...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard de Empresa</h2>
        <p className="text-slate-500 mt-1">Resumen en tiempo real de tus activos y mantenimientos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Total Activos</h3>
          <p className="text-4xl font-bold text-slate-900">{stats.totalAssets}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Operativos</h3>
          <p className="text-4xl font-bold text-green-600">{stats.activeAssets}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-yellow-500">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">En Taller / Mantenimiento</h3>
          <p className="text-4xl font-bold text-yellow-600">{stats.maintenanceAssets}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">QRs Libres</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.unassignedQRs}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Últimos Mantenimientos Registrados</h3>
          </div>
          <div className="p-0">
            {recentMaintenances.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">Aún no hay mantenimientos en el historial.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentMaintenances.map(m => (
                  <li key={m.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-900">{m.assetName}</span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{m.date}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <span className="font-medium text-blue-700">{m.type}</span> — {m.description}
                    </div>
                    {m.cost !== undefined && (
                      <div className="text-xs text-slate-500 mt-2 font-medium">
                        Costo: {m.currency === 'USD' ? 'U$D ' : m.currency === 'BRL' ? 'R$ ' : m.currency === 'ARS' ? 'AR$ ' : m.currency === 'PYG' ? 'Gs. ' : '$ '} 
                        {m.cost.toLocaleString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Acciones Rápidas</h3>
            <div className="flex flex-col gap-3">
              <Link href="/admin/assets/new" className="bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
                + Registrar Nueva Máquina / Vehículo
              </Link>
              <Link href="/admin/qr" className="bg-white hover:bg-slate-50 text-slate-700 text-center border border-slate-200 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
                Imprimir Nuevos Códigos QR
              </Link>
              <Link href="/admin/assets" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-center border border-transparent px-6 py-3 rounded-lg font-medium transition-colors">
                Ver Inventario Completo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
