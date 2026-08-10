"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Quote, SalesOrder } from "@/lib/repositories/types";
import { Plus, FileText, Loader2, ArrowRight, DollarSign } from "lucide-react";
import Link from "next/link";

export default function QuotesPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"quotes" | "sales">("quotes");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!tenantId) return;
      setLoading(true);
      try {
        const q = query(collection(db, "quotes"), where("tenantId", "==", tenantId));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
        data.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());
        setQuotes(data);
        
        // Fetch Sales
        const sQ = query(collection(db, "salesOrders"), where("tenantId", "==", tenantId));
        const sSnap = await getDocs(sQ);
        const sData = sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesOrder));
        sData.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());
        setSales(sData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, [tenantId]);

  const getStatusBadge = (status: Quote["status"]) => {
    switch (status) {
      case "draft": return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">Borrador</span>;
      case "sent": return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">Enviado</span>;
      case "approved": return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">Aprobado</span>;
      case "rejected": return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium border border-red-200">Rechazado</span>;
      case "invoiced": return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200">Facturado/Vendido</span>;
      default: return null;
    }
  };

  const getSaleStatusBadge = (status: SalesOrder["status"]) => {
    switch (status) {
      case "pending": return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200">Pendiente de Cobro</span>;
      case "partial": return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">Cobro Parcial</span>;
      case "paid": return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">Cobrado</span>;
      case "cancelled": return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">Anulado</span>;
      default: return null;
    }
  };

  const formatPaymentMethod = (method: string | null | undefined) => {
    if (!method) return "-";
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      default: return "Otro";
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventas y Presupuestos</h1>
          <p className="text-slate-500 mt-1">Gestiona los presupuestos emitidos y las ventas concretadas.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/admin/quotes/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Presupuesto
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("quotes")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'quotes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Presupuestos ({quotes.length})
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sales' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Ventas / Cobros ({sales.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === "quotes" ? (
          quotes.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-lg font-medium text-slate-700">No hay presupuestos</p>
              <p>Comienza creando un presupuesto para ofrecer tus productos o servicios.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Cliente / Vehículo</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Total</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Estado</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{quote.customerName}</div>
                      {quote.assetName && <div className="text-sm text-slate-500 mt-0.5">Vehículo: {quote.assetName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{quote.currency} {quote.total.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/quotes/${quote.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1 transition-colors"
                      >
                        Ver Detalle <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-700">No hay ventas registradas</p>
            <p>Aprueba un presupuesto y conviértelo a venta para registrar tus cobros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Cliente / Fecha</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Total Venta</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Cobrado</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Medio de Pago</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Estado</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{sale.customerName}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{(sale.createdAt as any)?.toDate?.()?.toLocaleDateString() || new Date(sale.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{sale.currency} {sale.total.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-emerald-600">{sale.currency} {(sale.payments?.reduce((acc, p) => acc + p.amount, 0) || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">{sale.payments && sale.payments.length > 0 ? formatPaymentMethod(sale.payments[sale.payments.length - 1].method) : "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getSaleStatusBadge(sale.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/sales/${sale.id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center justify-end gap-1 transition-colors"
                      >
                        Gestionar <ArrowRight className="w-4 h-4" />
                      </Link>
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
