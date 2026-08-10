"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Quote, SalesOrder, Tenant } from "@/lib/repositories/types";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Printer, ShoppingCart } from "lucide-react";

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.quoteId as string;
  const { profile } = useAuth();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment Form State
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) return;
      try {
        const docRef = doc(db, "quotes", quoteId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const quoteData = { id: snap.id, ...snap.data() } as Quote;
          setQuote(quoteData);
          
          if (quoteData.tenantId) {
            const tenantSnap = await getDoc(doc(db, "tenants", quoteData.tenantId));
            if (tenantSnap.exists()) setTenant(tenantSnap.data() as Tenant);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [quoteId]);

  const handleUpdateStatus = async (newStatus: Quote["status"]) => {
    if (!quote) return;
    setProcessing(true);
    try {
      const docRef = doc(db, "quotes", quote.id);
      await updateDoc(docRef, { status: newStatus });
      setQuote({ ...quote, status: newStatus });
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado");
    } finally {
      setProcessing(false);
    }
  };

  const handleConvertToSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || !profile) return;
    
    setProcessing(true);
    try {
      const parsedAmount = Number(amountPaid);
      
      let status: "pending" | "paid" | "partial" = "pending";
      if (parsedAmount >= quote.total) status = "paid";
      else if (parsedAmount > 0) status = "partial";

      const initialPayments = parsedAmount > 0 ? [{
        id: Math.random().toString(36).substr(2, 9),
        amount: parsedAmount,
        method: paymentMethod as any,
        date: new Date(),
        createdBy: profile.id
      }] : [];

      const salesOrder: Omit<SalesOrder, "id"> = {
        tenantId: quote.tenantId,
        quoteId: quote.id,
        customerId: quote.customerId,
        customerName: quote.customerName,
        assetId: quote.assetId || null as any,
        items: quote.items,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        total: quote.total,
        currency: quote.currency,
        status,
        payments: initialPayments,
        createdAt: new Date(),
        createdBy: profile.id
      };
      
      const orderRef = await addDoc(collection(db, "salesOrders"), salesOrder);
      
      // Actualizamos el presupuesto indicando que ya se facturó/vendió (opcional)
      await updateDoc(doc(db, "quotes", quote.id), { status: "invoiced" });
      
      alert("¡Venta registrada con éxito!");
      setShowPaymentModal(false);
      router.push("/admin/quotes");
      
    } catch (err) {
      console.error(err);
      alert("Error al registrar la venta");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!quote) return <div className="p-8 text-center text-slate-500">Presupuesto no encontrado.</div>;

  const isApproved = quote.status === "approved";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2 print:hidden">
        <button onClick={() => router.push("/admin/quotes")} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuesto #{quote.id.substring(0,6).toUpperCase()}</h1>
          <p className="text-slate-500 mt-1">Generado el {(quote.createdAt as any)?.toDate?.()?.toLocaleDateString() || new Date(quote.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Panel de Acciones Superiores */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Estado:</span>
          {quote.status === 'draft' && <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold">Borrador</span>}
          {quote.status === 'sent' && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">Enviado al Cliente</span>}
          {quote.status === 'approved' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Aprobado</span>}
          {quote.status === 'rejected' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-1"><XCircle className="w-4 h-4"/> Rechazado</span>}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
          
          {quote.status !== 'approved' && quote.status !== 'rejected' && (
            <button 
              onClick={() => handleUpdateStatus('approved')}
              disabled={processing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Marcar Aprobado
            </button>
          )}
          
          {isApproved && (
            <button 
              onClick={() => {
                setAmountPaid(quote.total.toString());
                setShowPaymentModal(true);
              }}
              disabled={processing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Registrar Venta y Cobro
            </button>
          )}
        </div>
      </div>

      {/* Documento Estilo Ticket/Factura */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Cabecera para impresión (Empresa) */}
        {tenant && (
          <div className="hidden print:flex flex-col items-center justify-center border-b border-slate-200 pb-4 mb-6">
            {tenant.logoUrl && <img src={tenant.logoUrl} alt="Logo" className="max-h-16 mb-2 grayscale" />}
            <h1 className="text-2xl font-black text-slate-900">{tenant.name}</h1>
            <p className="text-sm text-slate-600">Presupuesto Comercial</p>
          </div>
        )}

        <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 print:hidden">Presupuesto Comercial</h2>
            <h2 className="text-lg font-bold text-slate-800 hidden print:block">Nº {quote.id.substring(0,6).toUpperCase()}</h2>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p><strong className="text-slate-800">Cliente:</strong> {quote.customerName}</p>
              {quote.assetName && <p><strong className="text-slate-800">Vehículo/Activo:</strong> {quote.assetName}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">Total a pagar</div>
            <div className="text-3xl font-bold text-blue-600">{quote.currency} {(quote.total || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <th className="pb-3 w-1/2">Descripción</th>
                <th className="pb-3 w-24 text-center">Cant.</th>
                <th className="pb-3 w-32 text-right">Precio Unit.</th>
                <th className="pb-3 w-32 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    {item.description && <div className="text-sm text-slate-500">{item.description}</div>}
                  </td>
                  <td className="py-4 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-4 text-right text-slate-700">{quote.currency} {item.unitPrice.toLocaleString()}</td>
                  <td className="py-4 text-right font-medium text-slate-900">{quote.currency} {(item.quantity * item.unitPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{quote.currency} {(quote.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
              <span>Impuestos</span>
              <span>{quote.currency} {(quote.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{quote.currency} {(quote.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-12 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
            <strong className="block text-slate-800 mb-1">Notas y Condiciones:</strong>
            <p className="whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Modal de Cobro */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Registrar Pago</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleConvertToSale} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto a Cobrar ({quote.currency})</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0"
                  max={quote.total}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-lg font-semibold"
                />
                <p className="text-xs text-slate-500 mt-1">Total del presupuesto: {quote.total.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="card">Tarjeta de Crédito / Débito</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                  {processing ? "Guardando..." : "Confirmar Venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
