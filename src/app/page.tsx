"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { QrCode, ArrowRight, ShieldCheck, Zap, Globe2, ShoppingCart, Package, History, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TaggoQR</span>
          </div>
          <div className="flex items-center gap-4">
            {user && !loading ? (
              <Link 
                href={profile?.globalRole === "super_admin" ? "/superadmin" : "/admin"}
                className="px-5 py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Ir al Panel
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/register" 
                  className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                >
                  Crear Cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Split Design */}
      <main className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden border-b border-white/10">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Hero Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                <Zap className="w-4 h-4" />
                <span>La nueva forma de gestionar tus activos</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight text-white">
                Control total con <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  códigos inteligentes
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                TaggoQR permite a empresas de todo el mundo registrar, monitorear y gestionar presupuestos y ventas para todos sus activos utilizando simplemente códigos QR.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-white text-slate-950 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  Comenzar Gratis <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 text-base font-medium bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all text-center"
                >
                  Conocer más
                </Link>
              </div>
              
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Sin tarjeta de crédito</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Cancela cuando quieras</div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex-1 w-full relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/50 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/images/hero_dashboard.png" 
                  alt="TaggoQR Dashboard Interface" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Zig-Zag Features Section */}
      <section id="features" className="py-32 bg-white text-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-slate-900">Todo lo que tu negocio necesita en un solo lugar</h2>
            <p className="text-xl text-slate-600">
              Un sistema SaaS integral diseñado para acelerar tus ventas, controlar tu inventario y brindar una experiencia premium a tus clientes.
            </p>
          </div>

          <div className="space-y-32">
            
            {/* Feature 1: Ventas y Presupuestos (Image Right) */}
            <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Cotiza y vende al instante</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Genera presupuestos comerciales altamente profesionales en PDF. Envíalos a tus clientes y conviértelos a ventas con un solo clic. Controla pagos parciales, saldos pendientes y emite tickets de cobro estilizados.
                </p>
                <ul className="space-y-3 text-slate-700 font-medium mt-6">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Facturación rápida</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Control de pagos y saldos</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Exportación a PDF premium</li>
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-50 p-2">
                  <img src="/images/sales_quote.png" alt="Presupuesto Comercial" className="w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Feature 2: Generador QR (Image Left) */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 w-full">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-50 p-2">
                  <img src="/images/qr_generator.png" alt="Generador de QRs" className="w-full rounded-xl" />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Etiquetas QR dinámicas</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Imprime lotes de QRs en hojas autoadhesivas. Pégalos en tus máquinas o vehículos y asígnales información en tiempo real directamente desde tu celular en el terreno.
                </p>
                <ul className="space-y-3 text-slate-700 font-medium mt-6">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Impresión masiva en grilla</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Enlace dinámico a activos</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Listo para ticketeras o A4</li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Catálogo (Image Right) */}
            <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Catálogo e Inventario Central</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Mantén un registro estructurado de tus productos, repuestos y servicios. Consulta precios rápidamente mientras armas presupuestos frente al cliente para no cometer errores.
                </p>
                <ul className="space-y-3 text-slate-700 font-medium mt-6">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Gestión de Precios</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Autocompletado en presupuestos</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Búsqueda súper rápida</li>
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-50 p-2">
                  <img src="/images/product_catalog.png" alt="Catálogo de Productos" className="w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Feature 4: Historial (Image Left) */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 w-full lg:px-12">
                {/* Esta imagen (móvil) se verá mejor si limitamos su ancho */}
                <div className="rounded-[2.5rem] overflow-hidden border-[8px] border-slate-900 shadow-2xl max-w-sm mx-auto bg-slate-50">
                  <img src="/images/maintenance_history.png" alt="Historial de Mantenimiento" className="w-full h-auto object-cover" />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <History className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Historial público premium</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Otorga transparencia total. Cuando un cliente escanea el QR de su vehículo con su celular, accederá a un perfil público hermoso con todo el historial cronológico de mantenimientos que has realizado.
                </p>
                <ul className="space-y-3 text-slate-700 font-medium mt-6">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-amber-500" /> Línea de tiempo cronológica</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-amber-500" /> Diseño optimizado para móviles</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-amber-500" /> Confianza y retención de clientes</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer / CTA Dark */}
      <footer className="bg-slate-950 py-24 border-t border-white/10 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para modernizar tu gestión?</h2>
          <p className="text-slate-400 text-lg mb-10">Únete a TaggoQR hoy y comienza a operar tu empresa como los profesionales en minutos.</p>
          <Link 
            href="/register"
            className="inline-flex px-10 py-5 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 items-center gap-3"
          >
            Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
