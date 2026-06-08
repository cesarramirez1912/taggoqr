import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Gestión de Activos",
  description: "Plataforma de gestión de vehículos, máquinas y equipos con QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Principal (Global) */}
            <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col">
              <h1 className="text-xl font-bold mb-8 tracking-tight text-white/90">TaggoQR</h1>
              <nav className="flex flex-col space-y-4">
                <Link href="/superadmin" className="hover:text-purple-400 transition-colors font-medium">Panel Super Admin</Link>
                <div className="pt-4 mt-4 border-t border-slate-700"></div>
                <Link href="/admin" className="hover:text-blue-400 transition-colors">Dashboard Empresa</Link>
                <Link href="/admin/assets" className="hover:text-blue-400 transition-colors">Activos</Link>
                <Link href="/admin/qr" className="hover:text-blue-400 transition-colors">Imprimir QRs</Link>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
              {/* Navbar Placeholder */}
              <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
                <div className="flex-1"></div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm">
                    U
                  </div>
                </div>
              </header>
              
              <div className="flex-1 p-8">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
