"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Customer, Asset, Item, Quote, QuoteItem } from "@/lib/repositories/types";
import { Plus, Trash2, ArrowLeft, Loader2, Calculator } from "lucide-react";

export default function NewQuotePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data from DB
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [catalog, setCatalog] = useState<Item[]>([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("ocasional");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Line items state
  const [lineItems, setLineItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    const fetchFormData = async () => {
      if (!tenantId) return;
      setLoadingData(true);
      try {
        // Fetch Customers
        const cSnap = await getDocs(query(collection(db, "customers"), where("tenantId", "==", tenantId)));
        setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));

        // Fetch Assets
        const aSnap = await getDocs(query(collection(db, "assets"), where("tenantId", "==", tenantId)));
        setAssets(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));

        // Fetch Catalog
        const iSnap = await getDocs(query(collection(db, "items"), where("tenantId", "==", tenantId)));
        setCatalog(iSnap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchFormData();
  }, [tenantId]);

  // Derived state
  const subtotal = lineItems.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
  const taxAmount = 0; // Se podría añadir lógica de impuestos aquí
  const total = subtotal + taxAmount;

  const handleAddItem = () => {
    setLineItems([...lineItems, {
      id: Math.random().toString(36).substr(2, 9), // ID temporal
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      total: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...lineItems];
    const item = updated[index];
    
    // Si se seleccionó un producto del catálogo por su nombre
    if (field === 'name') {
      item.name = value;
      // Autocompletar precio y descripción si coincide con el catálogo
      const catalogItem = catalog.find(c => c.name === value);
      if (catalogItem) {
        item.description = catalogItem.description || "";
        item.unitPrice = catalogItem.price;
      }
    } else {
      (item as any)[field] = value;
    }

    // Recalcular subtotal y total de la línea
    item.subtotal = item.quantity * item.unitPrice;
    item.total = item.subtotal;
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (lineItems.length === 0) {
      alert("Debes agregar al menos un ítem al presupuesto.");
      return;
    }
    if (!selectedCustomerId) {
      alert("Debes seleccionar un cliente.");
      return;
    }

    setSaving(true);
    try {
      let finalCustomerName = "Cliente Ocasional";
      if (selectedCustomerId !== "ocasional") {
        const customer = customers.find(c => c.id === selectedCustomerId);
        finalCustomerName = customer?.name || "";
      }
      const asset = assets.find(a => a.id === selectedAssetId);

      const newQuote: Omit<Quote, "id"> = {
        tenantId,
        customerId: selectedCustomerId,
        customerName: finalCustomerName,
        assetId: selectedAssetId || null as any,
        assetName: asset ? `${asset.brand} ${asset.model} - ${asset.licensePlate || asset.name}` : null as any,
        items: lineItems,
        subtotal,
        taxAmount,
        total,
        currency,
        status: "draft",
        notes,
        validUntil: validUntil ? new Date(validUntil) : null as any,
        createdAt: new Date(),
        createdBy: profile?.id || ""
      };

      const docRef = await addDoc(collection(db, "quotes"), newQuote);
      
      // Navigate to the newly created quote view
      router.push(`/admin/quotes/${docRef.id}`);
    } catch (error) {
      console.error(error);
      alert("Error al generar el presupuesto");
      setSaving(false);
    }
  };

  if (loadingData) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Presupuesto</h1>
          <p className="text-slate-500 mt-1">Crea un presupuesto para un cliente y opcionalmente asócialo a un vehículo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Bloque 1: Cliente y Vehículo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Datos Generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
              <select 
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ocasional">Cliente Ocasional</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.documentId ? `(${c.documentId})` : ""}</option>)}
              </select>
              {customers.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">No tienes clientes guardados. <a href="/admin/customers" className="underline hover:text-slate-800">Crea uno aquí</a>.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehículo / Activo (Opcional)</label>
              <select 
                value={selectedAssetId}
                onChange={e => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Ninguno --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} - {a.licensePlate || a.customId}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Si seleccionas uno, el presupuesto aparecerá en el historial público del código QR asociado una vez aprobado.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda del Presupuesto</label>
              <select 
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="USD">USD - Dólares</option>
                <option value="PYG">PYG - Guaraníes</option>
                <option value="EUR">EUR - Euros</option>
                <option value="BRL">BRL - Reales</option>
                <option value="ARS">ARS - Pesos Arg.</option>
                <option value="MXN">MXN - Pesos Mex.</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Validez (Opcional)</label>
              <input 
                type="date" 
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloque 2: Ítems del Presupuesto */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-semibold text-slate-800">Detalle de Productos / Servicios</h3>
            <button 
              type="button"
              onClick={handleAddItem}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Agregar Línea
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                <Calculator className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                El presupuesto está vacío. Agrega repuestos o servicios.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                      <th className="pb-3 w-1/3">Nombre del Ítem</th>
                      <th className="pb-3 w-1/4">Descripción</th>
                      <th className="pb-3 w-24">Cant.</th>
                      <th className="pb-3 w-32">Precio Unit.</th>
                      <th className="pb-3 w-32 text-right">Total</th>
                      <th className="pb-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 pr-2">
                          {/* Sugerencias del Catálogo con DataList */}
                          <input 
                            required
                            type="text" 
                            list={`catalog-list-${index}`}
                            value={item.name}
                            onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                            placeholder="Buscar en catálogo..."
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                          />
                          <datalist id={`catalog-list-${index}`}>
                            {catalog.map(c => <option key={c.id} value={c.name} />)}
                          </datalist>
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            type="text" 
                            value={item.description || ""}
                            onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                            placeholder="Detalles..."
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            required
                            type="number" 
                            min="1"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            required
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                          />
                        </td>
                        <td className="py-3 text-right font-medium text-slate-800 text-sm">
                          {currency} {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totales */}
          {lineItems.length > 0 && (
            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-1/2 md:w-1/3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{currency} {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-200">
                  <span>Impuestos (0%)</span>
                  <span>{currency} {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>{currency} {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bloque 3: Notas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Condiciones y Notas</h3>
          <textarea 
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej. Los precios no incluyen instalación. Validez de 15 días."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200">
          <button 
            type="button" 
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            {saving ? "Guardando..." : "Crear Presupuesto"}
          </button>
        </div>
      </form>
    </div>
  );
}
