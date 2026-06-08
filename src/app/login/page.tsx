"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Intento real con Firebase
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/superadmin");
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  const handleMockLogin = () => {
    // Solo para pruebas rápidas de UI: Forzar redirección
    // Nota: El ProtectedRoute pedirá un usuario real de Firebase,
    // por lo que para una prueba total necesitarás configurar Firebase.
    router.push("/superadmin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">AssetManager Pro</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="admin@tusistema.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500 text-center mb-4">Modo de Prueba (Sin configurar Firebase)</p>
          <button 
            onClick={handleMockLogin}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition-colors"
          >
            Ver Interfaz de Super Admin
          </button>
        </div>
      </div>
    </div>
  );
}
