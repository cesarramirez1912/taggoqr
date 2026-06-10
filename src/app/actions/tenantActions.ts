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
      maxUsers: 3,
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

export async function updateTenantMaxUsers(tenantId: string, maxUsers: number) {
  try {
    await adminDb.collection("tenants").doc(tenantId).update({ maxUsers });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating max users:", error);
    return { success: false, error: error.message };
  }
}

export async function createUserForTenant(data: {
  tenantId: string;
  email: string;
  password?: string;
  role: "admin" | "editor";
}) {
  try {
    const tenantSnap = await adminDb.collection("tenants").doc(data.tenantId).get();
    if (!tenantSnap.exists) {
      return { success: false, error: "Empresa no encontrada" };
    }
    const tenantData = tenantSnap.data() as Tenant;
    const maxUsers = tenantData.maxUsers || 1;

    // Verificar usuarios actuales de este tenant
    const usersSnap = await adminDb.collection("users")
      .where(`tenantRoles.${data.tenantId}`, "in", ["admin", "editor"])
      .get();
      
    if (usersSnap.size >= maxUsers) {
      return { success: false, error: `Límite de usuarios (${maxUsers}) alcanzado para esta empresa.` };
    }

    const password = data.password || Math.random().toString(36).slice(-8);

    // 1. Crear el usuario en Firebase Authentication usando Admin SDK
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: password,
    });

    // 2. Crear el Perfil de Usuario asignándole el rol para esta empresa
    const profile: UserProfile = {
      id: userRecord.uid,
      email: userRecord.email!,
      globalRole: "none",
      tenantRoles: { [data.tenantId]: data.role }
    };

    await adminDb.collection("users").doc(userRecord.uid).set(profile);

    return { success: true, uid: userRecord.uid, password };
  } catch (error: any) {
    console.error("Error creando usuario para tenant:", error);
    return { success: false, error: error.message };
  }
}

export async function getUsersForTenant(tenantId: string) {
  try {
    const usersSnap = await adminDb.collection("users")
      .where(`tenantRoles.${tenantId}`, "in", ["admin", "editor"])
      .get();
      
    const users = usersSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    return { success: true, users };
  } catch (error: any) {
    console.error("Error fetching users for tenant:", error);
    return { success: false, error: error.message };
  }
}

export async function removeUserFromTenant(uid: string, tenantId: string) {
  try {
    // 1. Eliminar el rol del usuario en la base de datos
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data() as UserProfile;
      const tenantRoles = { ...userData.tenantRoles };
      delete tenantRoles[tenantId];
      
      await userRef.update({ tenantRoles });
    }

    // Opcional: si quieres eliminar la cuenta de Firebase Auth completamente cuando no tiene más roles, puedes hacerlo aquí
    // await adminAuth.deleteUser(uid);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error removing user from tenant:", error);
    return { success: false, error: error.message };
  }
}
