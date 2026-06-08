import { Tenant } from "./types";
import { adminDb } from "../firebase/admin";

export interface ITenantRepository {
  getTenant(tenantId: string): Promise<Tenant | null>;
  createTenant(tenant: Omit<Tenant, "createdAt">): Promise<Tenant>;
  listTenants(): Promise<Tenant[]>; // Solo para Super Admin
}

export class FirebaseTenantRepository implements ITenantRepository {
  async getTenant(tenantId: string): Promise<Tenant | null> {
    const doc = await adminDb.collection("tenants").doc(tenantId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Tenant;
  }

  async createTenant(tenant: Omit<Tenant, "createdAt">): Promise<Tenant> {
    const newTenant: Tenant = {
      ...tenant,
      createdAt: new Date(),
    };
    // El ID lo pasamos explícitamente (ej. nombre corto)
    await adminDb.collection("tenants").doc(tenant.id).set(newTenant);
    return newTenant;
  }

  async listTenants(): Promise<Tenant[]> {
    const snapshot = await adminDb.collection("tenants").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
  }
}

export const tenantRepository = new FirebaseTenantRepository();
