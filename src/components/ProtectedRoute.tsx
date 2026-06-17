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
  allowedRoles?: ("super_admin" | "admin" | "editor" | "operador")[];
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

  // Validación de roles globales y de tenant
  if (allowedRoles.length > 0) {
    const isSuperAdmin = currentGlobalRole === "super_admin";
    
    // Si es super_admin, tiene acceso a todo.
    // Si no, verificamos si tiene algún rol en algún tenant que esté dentro de allowedRoles
    let hasAllowedTenantRole = false;
    
    if (profile && profile.tenantRoles) {
      const rolesUsuario = Object.values(profile.tenantRoles);
      hasAllowedTenantRole = rolesUsuario.some(role => allowedRoles.includes(role as any));
    }
    
    const canAccess = isSuperAdmin || hasAllowedTenantRole;
    
    if (!canAccess) {
      return <div className="p-8 text-center text-red-500">Acceso Denegado. No tienes los permisos necesarios.</div>;
    }
  }

  return <>{children}</>;
}
