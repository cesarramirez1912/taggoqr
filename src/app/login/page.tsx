"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || "tu@correo.com";

  useEffect(() => {
    // Redirigir automáticamente si ya está logueado Y terminó de cargar el perfil
    if (!loading && user) {
      if (user.email === SUPER_ADMIN_EMAIL) {
        router.push("/superadmin");
      } else {
        router.push("/admin");
      }
    }
  }, [user, loading, router, SUPER_ADMIN_EMAIL]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const isEmail = email.includes('@');
      const finalEmail = isEmail ? email.trim() : `${email.trim().toLowerCase()}@taggoqr.app`;

      // Intento real con Firebase
      await signInWithEmailAndPassword(auth, finalEmail, password);
      // La redirección ocurrirá por el useEffect al cambiar el estado del user
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">AssetManager Pro</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario, Número Único o Email</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ej: operador123 o admin@sistema.com"
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


      </div>
    </div>
  );
}
