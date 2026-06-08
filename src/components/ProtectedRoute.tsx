"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserProfile } from "@/lib/repositories/types";
// Mock: Asumimos una forma de obtener el perfil después de loguear
// En la práctica, haríamos un fetch a una Server Action o API Route

export function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ("super_admin" | "admin" | "editor")[];
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Define tu email de Super Admin aquí (o en .env)
  const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || "tu@correo.com";

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    setChecking(false);
  }, [user, loading, router]);

  if (loading || checking) return <div className="p-8 text-center">Verificando seguridad...</div>;

  // El perfil en contexto podría tardar un momento más o estar nulo
  let currentGlobalRole = "none";
  if (user && user.email === SUPER_ADMIN_EMAIL) {
    currentGlobalRole = "super_admin";
  } else if (profile) {
    currentGlobalRole = profile.globalRole || "none";
  }

  // Validación de roles globales
  if (allowedRoles.length > 0) {
    // Si la ruta requiere un rol (como super_admin o admin)
    // Para simplificar: Si es super_admin, pasa.
    // Si la ruta pide "admin" y tiene roles de tenant en el profile, pasa.
    const isSuperAdmin = currentGlobalRole === "super_admin";
    const hasTenantRole = profile && profile.tenantRoles && Object.keys(profile.tenantRoles).length > 0;
    
    const canAccess = isSuperAdmin || (allowedRoles.includes("admin") && hasTenantRole);
    
    if (!canAccess) {
      return <div className="p-8 text-center text-red-500">Acceso Denegado. No tienes permisos.</div>;
    }
  }

  return <>{children}</>;
}
