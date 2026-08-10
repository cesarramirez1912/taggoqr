import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GlobalSidebar } from "@/components/GlobalSidebar";
import { GlobalHeader } from "@/components/GlobalHeader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaggoQR - Software de Gestión de Activos",
  description: "Plataforma líder para la gestión de vehículos, maquinarias y mantenimientos mediante etiquetas QR inteligentes.",
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
            <GlobalSidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
              <GlobalHeader />
              
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
