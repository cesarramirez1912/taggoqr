export interface Tenant {
  id: string;
  name: string;
  subscriptionStatus: "active" | "trial" | "inactive";
  createdAt: Date;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  globalRole: "super_admin" | "none";
  tenantRoles: Record<string, "admin" | "editor">; // tenantId -> role
}

export interface QRTag {
  id: string; // ej. qr_xyz123
  tenantId: string;
  assetId: string | null; // null si está vacío/no asignado
  status: "printed" | "assigned";
  createdAt: Date;
}

export interface Asset {
  id: string;
  tenantId: string;
  qrTagId: string; // Referencia al QRTag o string vacio si no tiene

  customId: string;
  name: string;
  type: "machine" | "vehicle" | "tool";
  
  // Campos agrícolas / vehiculares
  brand: string;
  model: string;
  year: number;
  vinOrChassis: string;
  usageMetrics: string; // ej. "15000 km", "450 hs"
  nextMaintenanceDate: string; // ISO date o texto

  qrCodeUrl: string;
  serialNumber: string;
  location: string;
  status: "active" | "maintenance" | "inactive";
  createdAt: Date;
}

export interface Maintenance {
  id: string;
  tenantId: string;
  assetId: string;
  date: string; // ISO date YYYY-MM-DD
  type: string; // ej. "Preventivo", "Correctivo"
  description: string;
  cost?: number; // Opcional, costo de la reparación
  currency?: string; // Ej. "USD", "PYG", "BRL"
  usageMetricsSnapshot?: string; // Ej. "15500 km" en el momento del mantenimiento
  photos: string[];
  createdAt: Date;
}
