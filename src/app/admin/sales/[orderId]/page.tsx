"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { SalesOrder, Payment, Tenant } from "@/lib/repositories/types";
import { ArrowLeft, Loader2, DollarSign, Receipt, Clock, CreditCard, Printer } from "lucide-react";

export default function SalesOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { profile } = useAuth();
  
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");
  const [paymentRef, setPaymentRef] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const docRef = doc(db, "salesOrders", orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const orderData = { id: snap.id, ...snap.data() } as SalesOrder;
          setOrder(orderData);
          if (orderData.tenantId) {
            const tenantSnap = await getDoc(doc(db, "tenants", orderData.tenantId));
            if (tenantSnap.exists()) setTenant(tenantSnap.data() as Tenant);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const totalPaid = order?.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const pendingBalance = order ? order.total - totalPaid : 0;

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !profile) return;
    
    setProcessing(true);
    try {
      const amount = Number(paymentAmount);
      if (amount <= 0 || amount > pendingBalance) {
        alert("Monto inválido");
        return;
      }

      const newPayment: any = {
        id: Math.random().toString(36).substr(2, 9),
        amount,
        method: paymentMethod,
        date: new Date(),
        createdBy: profile.id
      };
      if (paymentRef) {
        newPayment.reference = paymentRef;
      }

      const updatedPayments = [...(order.payments || []), newPayment];
      const newTotalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
      
      let newStatus: SalesOrder["status"] = "partial";
      if (newTotalPaid >= order.total) {
        newStatus = "paid";
      }

      const docRef = doc(db, "salesOrders", order.id);
      await updateDoc(docRef, { 
        payments: updatedPayments,
        status: newStatus,
        updatedAt: new Date()
      });
      
      setOrder({ ...order, payments: updatedPayments, status: newStatus });
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentRef("");
      
    } catch (err) {
      console.error(err);
      alert("Error al registrar el cobro");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!order) return <div className="p-8 text-center text-slate-500">Orden no encontrada.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2 print:hidden">
        <button onClick={() => router.push("/admin/quotes")} className="text-slate-400 hover:text-slate-600 print:hidden">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Orden de Venta #{order.id.substring(0,6).toUpperCase()}</h1>
          <p className="text-slate-500 mt-1">
            Emitida el {(order.createdAt as any)?.toDate?.()?.toLocaleDateString() || new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          className="print:hidden px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumen General */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0">
            
            {/* Cabecera para impresión (Empresa) */}
            {tenant && (
              <div className="hidden print:flex flex-col items-center justify-center border-b border-slate-200 pb-4 mb-6">
                {tenant.logoUrl && <img src={tenant.logoUrl} alt="Logo" className="max-h-16 mb-2 grayscale" />}
                <h1 className="text-2xl font-black text-slate-900">{tenant.name}</h1>
                <p className="text-sm text-slate-600">Ticket de Venta</p>
                <h2 className="text-lg font-bold text-slate-800 mt-2">Nº {order.id.substring(0,6).toUpperCase()}</h2>
              </div>
            )}

            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 print:hidden">Datos de la Venta</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="block text-slate-500 font-medium mb-1">Cliente</strong>
                <span className="text-slate-900 font-medium text-base">{order.customerName}</span>
              </div>
              {order.assetName && (
                <div>
                  <strong className="block text-slate-500 font-medium mb-1">Vehículo / Activo</strong>
                  <span className="text-slate-900">{order.assetName}</span>
                </div>
              )}
            </div>

            <div className="mt-8">
              <strong className="block text-slate-500 font-medium mb-3">Detalle Facturado</strong>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <th className="pb-2 font-semibold">Ítem</th>
                    <th className="pb-2 font-semibold text-center">Cant.</th>
                    <th className="pb-2 font-semibold text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-slate-800">{item.name}</td>
                      <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-2 text-right font-medium text-slate-900">{order.currency} {(item.unitPrice * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-slate-500">Total Venta</div>
                  <div className="text-xl font-bold text-slate-900">{order.currency} {order.total.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Footer TaggoQR solo para impresión */}
            <div className="hidden print:flex flex-col items-center justify-center mt-12 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Tecnología de Gestión por</p>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg text-slate-900">TAGGO<span className="text-slate-500">QR</span></span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">taggoqr.app</p>
            </div>
          </div>
        </div>

        {/* Panel de Cobros */}
        <div className="space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Estado de Cuenta</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Venta:</span>
                <span className="font-semibold text-slate-900">{order.currency} {order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Cobrado:</span>
                <span className="font-semibold text-emerald-600">{order.currency} {totalPaid.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-medium text-slate-800">Saldo Pendiente:</span>
                <span className="text-lg font-bold text-red-600">{order.currency} {pendingBalance.toLocaleString()}</span>
              </div>
            </div>

            {pendingBalance > 0 && (
              <button 
                onClick={() => {
                  setPaymentAmount(pendingBalance.toString());
                  setShowPaymentModal(true);
                }}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" /> Registrar Cobro
              </button>
            )}
            
            {pendingBalance === 0 && (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-center font-semibold flex items-center justify-center gap-2">
                <Receipt className="w-5 h-5" /> Venta Totalmente Pagada
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Historial de Cobros</h3>
            {(!order.payments || order.payments.length === 0) ? (
              <div className="text-sm text-slate-500 text-center py-4 flex flex-col items-center">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                No hay cobros registrados
              </div>
            ) : (
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{order.currency} {p.amount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3" /> 
                        {p.method === 'cash' ? 'Efectivo' : p.method === 'card' ? 'Tarjeta' : p.method === 'transfer' ? 'Transferencia' : 'Otro'}
                        {p.reference && ` - Ref: ${p.reference}`}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {(p.date as any)?.toDate?.()?.toLocaleDateString() || new Date(p.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Registrar Cobro</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto a Cobrar ({order.currency})</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max={pendingBalance}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-lg font-semibold"
                />
                <p className="text-xs text-slate-500 mt-1">Saldo pendiente: {pendingBalance.toLocaleString()}</p>
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

              {paymentMethod === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nro. de Comprobante / Referencia</label>
                  <input 
                    type="text" 
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="Opcional..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                  {processing ? "Guardando..." : "Confirmar Cobro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
