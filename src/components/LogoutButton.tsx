"use client";

import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut(auth);
    // No usamos router.push() aquí porque el ProtectedRoute 
    // detectará que ya no hay usuario y expulsará al usuario automáticamente a /login
    // Esto evita loops infinitos.
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
    >
      Cerrar Sesión
    </button>
  );
}
