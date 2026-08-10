"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Asset, Maintenance, Tenant, SalesOrder, Quote } from "@/lib/repositories/types";
import { getIndustryTerms } from "@/lib/utils/industryTerms";
import Link from "next/link";

export default function PublicAssetViewPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  
  // Timeline events
  const [timeline, setTimeline] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssetData = async () => {
      if (!assetId) {
        setError("ID de activo no proporcionado.");
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

        const data = { ...docSnap.data(), id: docSnap.id } as Asset;
        setAsset(data);

        // Fetch Tenant
        const tSnap = await getDoc(doc(db, "tenants", data.tenantId));
        if (tSnap.exists()) {
          setTenant(tSnap.data() as Tenant);
        }

        // Fetch Maintenances
        const mQuery = query(collection(db, "maintenances"), where("assetId", "==", assetId));
        const mSnap = await getDocs(mQuery);
        const mList = mSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'maintenance' } as any));
        
        // Fetch Sales Orders
        const sQuery = query(collection(db, "salesOrders"), where("assetId", "==", assetId));
        const sSnap = await getDocs(sQuery);
        const sList = sSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'sale' } as any));

        // Fetch Approved Quotes (that are not invoiced yet)
        const qQuery = query(collection(db, "quotes"), where("assetId", "==", assetId), where("status", "==", "approved"));
        const qSnap = await getDocs(qQuery);
        const qList = qSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'quote' } as any));

        // Combine and sort
        let combined = [...mList, ...sList, ...qList];
        
        // Privacy check: If user is not admin of this tenant, filter out private items
        const isTenantAdmin = profile && profile.tenantRoles && profile.tenantRoles[aData.tenantId];
        if (!isTenantAdmin) {
          combined = combined.filter(item => item.isPublic !== false);
        }

        combined.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.date || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.date || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setTimeline(combined);

      } catch (err: any) {
        console.error(err);
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [assetId, profile]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil del activo...</div>;
  if (error || !asset) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  // Verificar si el usuario actual tiene permisos sobre ESTE activo
  const canEdit = profile && profile.tenantRoles && profile.tenantRoles[asset.tenantId];

  const terms = getIndustryTerms(tenant?.industry);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabecera de la Empresa (Tenant) */}
        {tenant && (
          <div className="flex items-center gap-3 px-2 mb-2">
            {tenant.logoUrl && <img src={tenant.logoUrl} alt="Logo" className="max-h-10 rounded-md" />}
            <span className="font-bold text-slate-700 text-lg">{tenant.name}</span>
          </div>
        )}
        
        {/* Header del Activo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2 uppercase tracking-wide">
                {asset.type === 'machine' ? 'Máquina' : asset.type === 'vehicle' ? 'Vehículo' : 'Herramienta'}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
              <p className="text-slate-500 font-mono mt-1 text-sm tracking-wide">ID: {asset.customId}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm w-max ${
              asset.status === 'active' ? 'bg-green-100 text-green-700' : 
              asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {asset.status === 'active' ? 'Operativo' : 
               asset.status === 'maintenance' ? 'En Mantenimiento' : 'Inactivo'}
            </div>
          </div>
          
          {(terms.hasCustomer || terms.hasLicensePlate) && (asset.customerName || asset.licensePlate) && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              {terms.hasCustomer && asset.customerName && (
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Cliente / Dueño</p>
                  <p className="text-slate-900 font-bold text-lg">{asset.customerName}</p>
                </div>
              )}
              <div className="flex gap-6">
                {terms.hasLicensePlate && asset.licensePlate && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Placa / Patente</p>
                    <p className="text-slate-900 font-mono font-bold bg-white px-3 py-1 rounded border border-slate-200">{asset.licensePlate}</p>
                  </div>
                )}
                {terms.hasCustomer && asset.customerPhone && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Teléfono</p>
                    <p className="text-slate-900 font-medium">{asset.customerPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Marca / Modelo</p>
              <p className="text-slate-900 font-medium">{asset.brand || "-"} / {asset.model || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Año</p>
              <p className="text-slate-900 font-medium">{asset.year || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">VIN / Chasis</p>
              <p className="text-slate-900 font-medium">{asset.vinOrChassis || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Nº Serie Motor</p>
              <p className="text-slate-900 font-medium">{asset.serialNumber || "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Uso Actual</p>
              <p className="text-blue-700 font-bold bg-blue-50 inline-block px-2 py-0.5 rounded">{asset.usageMetrics || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Próx. Mantenimiento</p>
              <p className="text-slate-900 font-medium">{asset.nextMaintenanceDate || "No programado"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Ubicación / Sector</p>
              <p className="text-slate-900 font-medium">{asset.location || "No especificada"}</p>
            </div>
          </div>

          {/* Acciones para Admins */}
          {canEdit && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/edit`)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Editar {terms.asset}
              </button>
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/print-qr`)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                🖨️ Imprimir QR
              </button>
              <button 
                onClick={() => router.push(`/admin/assets/${assetId}/maintenance/new`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                + Registrar Mantenimiento
              </button>
            </div>
          )}

          {/* Acciones para Operadores */}
          <div className={`pt-6 flex flex-wrap gap-3 ${!canEdit ? 'mt-8 border-t border-slate-100' : 'mt-3'}`}>
            <button 
              onClick={() => router.push(`/a/${assetId}/checklist`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full md:w-auto text-center"
            >
              📋 Registrar Servicio
            </button>
          </div>
        </div>

        {/* Historial Vitalicio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Historial Vitalicio</h2>
          
          {timeline.length === 0 ? (
            <p className="text-slate-500 italic">No hay historial registrado aún.</p>
          ) : (
            <div className="space-y-6">
              {timeline.map(item => {
                const isMaintenance = item._type === 'maintenance';
                const isSale = item._type === 'sale';
                const isQuote = item._type === 'quote';
                
                const itemDate = item.createdAt?.toDate?.().toLocaleDateString() || item.date;
                const totalAmount = item.total || item.cost;
                const currency = item.currency || "";

                return (
                  <div key={`${item._type}-${item.id}`} className="relative pl-6 border-l-2 border-slate-200 last:border-l-0 pb-6 last:pb-0">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-white ${isSale ? 'bg-purple-500' : isQuote ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-500 block mb-1">{itemDate}</span>
                        {isSale && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Venta / Servicio</span>}
                        {isQuote && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Presupuesto Aprobado</span>}
                        {isMaintenance && item.usageMetricsSnapshot && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Uso: {item.usageMetricsSnapshot}</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-slate-800 mt-1">
                        {isMaintenance ? item.type : "Orden Comercial"}
                      </h3>
                      
                      {isMaintenance && <p className="text-slate-600 mt-2 whitespace-pre-wrap">{item.description}</p>}
                      
                      {(isSale || isQuote) && item.items && (
                        <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <ul className="text-sm text-slate-600 space-y-1">
                            {item.items.map((li: any, idx: number) => (
                              <li key={idx} className="flex justify-between">
                                <span>{li.quantity}x {li.name}</span>
                                <span>{currency} {(li.unitPrice * li.quantity).toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {totalAmount !== undefined && (
                        <p className="mt-3 text-sm font-medium text-slate-700">
                          Total: <span className="text-slate-900 font-bold">
                            {currency === 'USD' ? 'U$D ' : currency === 'PYG' ? 'Gs. ' : '$'} 
                            {totalAmount.toLocaleString()}
                          </span>
                        </p>
                      )}

                      {canEdit && (isSale || isQuote) && (
                        <div className="mt-3">
                          <Link href={`/admin/${isSale ? 'sales' : 'quotes'}/${item.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium underline">
                            Gestionar en Admin &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center pb-8 pt-4">
          <p className="text-sm text-slate-400 font-medium">Gestionado por <strong className="text-slate-500">TaggoQR</strong></p>
        </div>

      </div>
    </div>
  );
}
