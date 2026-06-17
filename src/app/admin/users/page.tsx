"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Tenant, UserProfile } from "@/lib/repositories/types";
import { createUserForTenant, getUsersForTenant, removeUserFromTenant } from "@/app/actions/tenantActions";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function TenantAdminUsersPage() {
  const { profile } = useAuth();
  
  const tenantId = profile?.tenantRoles ? Object.keys(profile.tenantRoles)[0] : null;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para nuevo usuario
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "editor" | "operador">("editor");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!tenantId) return;
    try {
      const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
      if (tenantSnap.exists()) {
        setTenant({ ...tenantSnap.data(), id: tenantSnap.id } as Tenant);
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
    if (tenantId) fetchData();
  }, [tenantId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    
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
    if (!tenantId) return;
    if (uid === profile?.id) {
      alert("No puedes eliminarte a ti mismo.");
      return;
    }
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

  if (!tenantId) return <div className="p-8">No tienes permisos para ver esto.</div>;
  if (loading) return <div className="p-8">Cargando datos...</div>;
  if (!tenant) return <div className="p-8">Empresa no encontrada</div>;

  const maxUsers = tenant.maxUsers || 1;
  // Operadores don't count towards the limit
  const nonOperatorUsersCount = users.filter(u => u.tenantRoles[tenantId] !== "operador").length;
  const canAddMore = nonOperatorUsersCount < maxUsers;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Gestionar Usuarios
          </h2>
          <p className="text-slate-500 mt-1">
            Límite de Admins/Editores: <strong>{maxUsers} usuarios</strong> (Ocupados: {nonOperatorUsersCount})
            <br/><span className="text-sm">Los usuarios con rol "Operador" son ilimitados y gratuitos.</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (!canAddMore) {
                alert(`Has alcanzado el límite de usuarios permitidos (${maxUsers}). Contacta al soporte para aumentar tu plan.`);
                return;
              }
              setIsUserModalOpen(true);
            }}
            className={`${canAddMore ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} px-4 py-2 rounded-lg font-medium shadow-sm transition-colors`}
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium">Usuario / Email</th>
              <th className="p-4 font-medium">Cargo (Rol)</th>
              <th className="p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">
                  {u.username || u.email}
                  {u.id === profile?.id && <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Tú</span>}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                    u.tenantRoles[tenantId] === 'admin' ? 'bg-purple-100 text-purple-700' : 
                    u.tenantRoles[tenantId] === 'editor' ? 'bg-blue-100 text-blue-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {u.tenantRoles[tenantId]}
                  </span>
                </td>
                <td className="p-4">
                  {u.id !== profile?.id && (
                    <button 
                      onClick={() => handleRemoveUser(u.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Quitar Acceso
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4">Agregar Usuario</h3>
            {actionError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{actionError}</div>}
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuario, Número Único o Email</label>
                <input 
                  type="text" 
                  required
                  value={newUserEmail} 
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ej: operador123 o correo@empresa.com"
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
                  onChange={(e) => setNewUserRole(e.target.value as "admin" | "editor" | "operador")}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="operador">Operador (Solo puede llenar checklists desde el celular. No consume cupos)</option>
                  <option value="editor">Editor (Puede crear y modificar máquinas/mantenimientos)</option>
                  <option value="admin">Administrador (Puede crear usuarios y editar ajustes)</option>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
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
