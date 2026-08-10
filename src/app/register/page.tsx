"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTenantWithAdmin } from "@/app/actions/tenantActions";
import Link from "next/link";
import { QrCode, ArrowRight, Building2, Globe2, Briefcase, User, CheckCircle2, Loader2 } from "lucide-react";

import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", 
  "Cuba", "Ecuador", "El Salvador", "España", "Guatemala", "Honduras", 
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", 
  "República Dominicana", "Uruguay", "Venezuela"
];

const INDUSTRIES = [
  "Agricultura", "Automotriz", "Construcción", "Logística", "Mantenimiento Industrial", 
  "Minería", "Transporte", "Particular / Uso Personal", "Otro"
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    country: "",
    tenantName: "",
    industry: "",
    adminEmail: "",
    adminPassword: "",
  });

  const handleNext = () => {
    if (step === 1 && !formData.country) return setError("Selecciona un país");
    if (step === 2 && !formData.tenantName) return setError("Ingresa el nombre de tu empresa");
    if (step === 3 && !formData.industry) return setError("Selecciona el rubro de tu empresa");
    
    setError("");
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adminEmail || !formData.adminPassword) {
      return setError("Completa todos los campos");
    }

    setLoading(true);
    setError("");

    try {
      const result = await createTenantWithAdmin(formData);
      if (result.success) {
        // Formatear el email igual que en el backend (si no tiene @, agregarle el dominio)
        const isEmail = formData.adminEmail.includes('@');
        const finalEmail = isEmail ? formData.adminEmail.trim() : `${formData.adminEmail.trim().toLowerCase()}@taggoqr.app`;
        
        // Autologuear al usuario
        await signInWithEmailAndPassword(auth, finalEmail, formData.adminPassword);
        
        // Redirigir al panel de la empresa
        router.push("/admin");
      } else {
        setError(result.error || "Error al crear la cuenta");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col selection:bg-blue-500/30">
      {/* Header simple */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">TaggoQR</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Indicador de pasos */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${step >= s ? "bg-blue-600 text-white" : "bg-white/10 text-slate-400"}`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-12 sm:w-20 h-[2px] mx-2 ${step > s ? "bg-blue-600" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Globe2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">¿De dónde nos visitas?</h2>
                  <p className="text-slate-400 text-sm">Selecciona tu país para comenzar el registro.</p>
                </div>
                
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar País...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button 
                  onClick={handleNext}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Nombre de tu Empresa</h2>
                  <p className="text-slate-400 text-sm">¿Cómo se llama la organización que registrarás?</p>
                </div>
                
                <input
                  type="text"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  placeholder="Ej. Acme Corp"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />

                <div className="flex gap-3">
                  <button onClick={handlePrev} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">Volver</button>
                  <button onClick={handleNext} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Rubro o Sector</h2>
                  <p className="text-slate-400 text-sm">¿A qué se dedica {formData.tenantName || "tu empresa"}?</p>
                </div>
                
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Seleccionar Rubro...</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>

                <div className="flex gap-3">
                  <button onClick={handlePrev} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">Volver</button>
                  <button onClick={handleNext} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                    <User className="w-6 h-6 text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Crea tu Cuenta Administradora</h2>
                  <p className="text-slate-400 text-sm">Con estos datos podrás ingresar al panel de {formData.tenantName || "tu empresa"}.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@tuempresa.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handlePrev} disabled={loading} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50">Volver</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalizar Registro"}
                  </button>
                </div>
              </form>
            )}

          </div>
          <div className="text-center mt-6 text-slate-400 text-sm">
            ¿Ya tienes una cuenta? <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Inicia Sesión</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
