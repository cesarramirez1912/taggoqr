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
  qrTagId: string; // Referencia al QRTag

  customId: string;
  name: string;
  type: "machine" | "vehicle" | "tool";
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
  date: Date;
  type: string;
  description: string;
  nextMaintenanceDate?: Date;
  photos: string[];
  createdAt: Date;
}
