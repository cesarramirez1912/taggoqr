"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Tenant, UserProfile } from "@/lib/repositories/types";
import { createUserForTenant, updateTenantMaxUsers, getUsersForTenant, removeUserFromTenant } from "@/app/actions/tenantActions";

export default function TenantUsersPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const { tenantId } = use(params);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para límite
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(1);

  // Modal para nuevo usuario
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "editor">("editor");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
      if (tenantSnap.exists()) {
        const t = { ...tenantSnap.data(), id: tenantSnap.id } as Tenant;
        setTenant(t);
        setNewLimit(t.maxUsers || 1);
      }

      const usersRes = await getUsersForTenant(tenantId);
      if (usersRes.success) {
        setUsers(usersRes.users as UserProfile[]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleUpdateLimit = async () => {
    setIsSubmitting(true);
    const res = await updateTenantMaxUsers(tenantId, newLimit);
    setIsSubmitting(false);
    if (res.success) {
      setIsLimitModalOpen(false);
      fetchData();
    } else {
      alert("Error actualizando límite: " + res.error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setIsSubmitting(true);

    const res = await createUserForTenant({
      tenantId,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole
    });

    setIsSubmitting(false);
    if (res.success) {
      alert(`Usuario creado. Contraseña (guárdala): ${res.password}`);
      setIsUserModalOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      fetchData();
    } else {
      setActionError(res.error || "Error al crear usuario.");
    }
  };

  const handleRemoveUser = async (uid: string) => {
    if (!confirm("¿Seguro que deseas remover a este usuario de la empresa?")) return;
    
    setIsSubmitting(true);
    const res = await removeUserFromTenant(uid, tenantId);
    setIsSubmitting(false);
    
    if (res.success) {
      fetchData();
    } else {
      alert("Error al remover usuario: " + res.error);
    }
  };

  if (loading) return <div className="p-8">Cargando datos...</div>;
  if (!tenant) return <div className="p-8">Empresa no encontrada</div>;

  const maxUsers = tenant.maxUsers || 1;
  const canAddMore = users.length < maxUsers;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/superadmin")} className="text-sm text-purple-600 font-medium mb-2 hover:underline">
            ← Volver a Empresas
          </button>
          <h2 className="text-2xl font-bold text-slate-900">
            Usuarios de: <span className="text-purple-700">{tenant.name}</span>
          </h2>
          <p className="text-slate-500 mt-1">
            Límite actual: <strong>{maxUsers} usuarios</strong> (Ocupados: {users.length})
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsLimitModalOpen(true)}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Editar Límite
          </button>
          <button 
            onClick={() => {
              if (!canAddMore) {
                alert(`No se pueden añadir más usuarios. El límite es ${maxUsers}.`);
                return;
              }
              setIsUserModalOpen(true);
            }}
            className={`${canAddMore ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} px-4 py-2 rounded-lg font-medium shadow-sm transition-colors`}
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Cargo (Rol)</th>
              <th className="p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                    u.tenantRoles[tenantId] === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.tenantRoles[tenantId]}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => handleRemoveUser(u.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Quitar Acceso
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Editar Límite */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4">Límite de Usuarios</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Máxima</label>
              <input 
                type="number" 
                min={1} 
                value={newLimit} 
                onChange={(e) => setNewLimit(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsLimitModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateLimit}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Límite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Agregar Usuario a {tenant.name}</h3>
            {actionError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{actionError}</div>}
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={newUserEmail} 
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Se generará una automáticamente si está vacío"
                  value={newUserPassword} 
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo (Rol)</label>
                <select 
                  value={newUserRole} 
                  onChange={(e) => setNewUserRole(e.target.value as "admin" | "editor")}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="editor">Editor (Puede crear y modificar activos/mantenimientos)</option>
                  <option value="admin">Administrador (Puede modificar datos de empresa)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
