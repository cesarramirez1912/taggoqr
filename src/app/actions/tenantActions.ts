"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserProfile, Tenant } from "@/lib/repositories/types";

export async function createTenantWithAdmin(data: {
  tenantName: string;
  adminEmail: string;
  adminPassword?: string;
}) {
  try {
    // Si no se proporciona contraseña, genera una básica (o lanza error, según prefieras)
    const password = data.adminPassword || Math.random().toString(36).slice(-8);

    // 1. Crear el usuario en Firebase Authentication usando Admin SDK
    const userRecord = await adminAuth.createUser({
      email: data.adminEmail,
      password: password,
    });

    // 2. Crear el registro de la Empresa (Tenant) en Firestore
    const tenantRef = adminDb.collection("tenants").doc();
    const newTenant: Tenant = {
      id: tenantRef.id,
      name: data.tenantName,
      subscriptionStatus: "active",
      createdAt: new Date(),
    };
    
    // 3. Crear el Perfil de Usuario asignándole el rol de admin para esta empresa
    const profile: UserProfile = {
      id: userRecord.uid,
      email: userRecord.email!,
      globalRole: "none",
      tenantRoles: { [tenantRef.id]: "admin" }
    };

    // Usamos un batch para asegurar que ambos documentos se guarden a la vez
    const batch = adminDb.batch();
    batch.set(tenantRef, newTenant);
    batch.set(adminDb.collection("users").doc(userRecord.uid), profile);
    await batch.commit();

    return { success: true, tenantId: tenantRef.id };
  } catch (error: any) {
    console.error("Error creando tenant y admin:", error);
    return { success: false, error: error.message };
  }
}
