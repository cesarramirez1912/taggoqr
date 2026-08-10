"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Item } from "@/lib/repositories/types";
import { Plus, Trash2, Package, Wrench, Loader2 } from "lucide-react";

export default function CatalogPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [type, setType] = useState<"product" | "service">("product");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;

  const fetchItems = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const q = query(collection(db, "items"), where("tenantId", "==", tenantId));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      // Sort loosely by created at if possible, or just name
      data.sort((a, b) => a.name.localeCompare(b.name));
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    try {
      const newItem = {
        tenantId,
        type,
        name,
        description,
        price: Number(price),
        currency,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "items"), newItem);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      fetchItems();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el ítem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este ítem?")) return;
    try {
      await deleteDoc(doc(db, "items", id));
      setItems(items.filter(i => i.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error al eliminar");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos y Servicios</h1>
          <p className="text-slate-500 mt-1">Gestiona los precios base para tus presupuestos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ítem
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-700">Tu catálogo está vacío</p>
            <p>Agrega productos (repuestos, aceite) o servicios (mano de obra) para usarlos en tus presupuestos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Tipo</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Nombre</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Precio Base</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {item.type === 'product' 
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><Package className="w-3.5 h-3.5"/> Producto</span>
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Wrench className="w-3.5 h-3.5"/> Servicio</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      {item.description && <div className="text-sm text-slate-500 mt-0.5">{item.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.currency} {item.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Ítem */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Agregar al Catálogo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ítem</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={type === 'product'} onChange={() => setType('product')} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-700">Producto / Repuesto</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={type === 'service'} onChange={() => setType('service')} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-700">Servicio / Mano de obra</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Filtro de Aceite"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej. Marca Bosch compatible con Toyota"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio *</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
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
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                  {saving ? "Guardando..." : "Guardar Ítem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
