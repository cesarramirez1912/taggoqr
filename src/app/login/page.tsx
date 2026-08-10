"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
    setIsLoggingIn(true);

    try {
      const isEmail = email.includes('@');
      const finalEmail = isEmail ? email.trim() : `${email.trim().toLowerCase()}@taggoqr.app`;

      // Intento real con Firebase
      await signInWithEmailAndPassword(auth, finalEmail, password);
      // La redirección ocurrirá por el useEffect al cambiar el estado del user
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión. Verifica tus credenciales.");
      setIsLoggingIn(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 w-full h-96 bg-slate-900 pointer-events-none" />
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-blue-900/40 to-transparent pointer-events-none" />

      {/* Logo/Header */}
      <Link href="/" className="relative z-10 flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl text-white">T</div>
        <span className="text-3xl font-black tracking-tight text-white">TAGGO<span className="text-blue-400">QR</span></span>
      </Link>

      {/* Tarjeta de Login */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-8 py-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido de nuevo</h2>
            <p className="text-slate-500">Ingresa tus credenciales para continuar.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-2 border border-red-100">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Usuario o Correo Electrónico</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 font-medium"
                placeholder="ej: operador123 o admin@empresa.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-slate-700">Contraseña</label>
                <a href="#" className="text-sm text-blue-600 font-medium hover:text-blue-700">¿Olvidaste tu contraseña?</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Iniciar Sesión <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            ¿No tienes una cuenta aún?{" "}
            <Link href="/register" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
              Regístrate ahora
            </Link>
          </p>
        </div>
      </div>
      
      {/* Footer minimalista */}
      <div className="relative z-10 mt-12 text-slate-400 text-sm flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span>Acceso seguro a TaggoQR</span>
      </div>

    </div>
  );
}
