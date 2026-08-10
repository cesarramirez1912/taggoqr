export interface Tenant {
  id: string;
  name: string;
  country?: string;
  industry?: string;
  subscriptionStatus: "active" | "trial" | "inactive";
  maxUsers?: number;
  logoUrl?: string;
  haciendas?: string[];
  operadores?: string[];
  createdAt: Date;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  globalRole: "super_admin" | "none";
  tenantRoles: Record<string, "admin" | "editor" | "operador">; // tenantId -> role
  lastAccessAt?: string; // ISO date string
  username?: string;
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
  
  // Campos agrícolas / vehiculares generales
  brand: string;
  model: string;
  year: number;
  vinOrChassis: string;
  usageMetrics: string; // ej. "15000 km", "450 hs"
  nextMaintenanceDate: string; // ISO date o texto

  // Campos específicos para servicios a terceros (Automotriz, Talleres)
  licensePlate?: string; // Placa / Patente
  customerName?: string;
  customerPhone?: string;

  qrCodeUrl: string;
  serialNumber: string;
  location: string;
  status: "active" | "maintenance" | "inactive";
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
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
  isPublic?: boolean; // Control de privacidad para el QR público
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface OperatorChecklist {
  id: string;
  tenantId: string;
  assetId: string | null;
  hacienda: string;
  operador: string;
  maquinaNombre: string;
  fecha: string;
  turno: "Mañana" | "Tarde" | "Noche";
  horaInicio: string;
  createdAt: Date;
}

export interface ServiceOrder {
  id: string;
  tenantId: string;
  assetId: string;
  type: string; // ej. "Limpieza de pico", "Cambio de aceite"
  status: "pending" | "in_progress" | "completed";
  description?: string;
  operatorId?: string; // UID o nombre del operador
  createdAt: Date;
  completedAt?: Date;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  documentId?: string; // RUC, CUIT, DNI, etc.
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface Item {
  id: string;
  tenantId: string;
  type: "product" | "service";
  name: string;
  description?: string;
  price: number;
  currency: string; // "USD", "PYG", "EUR"
  createdAt: Date;
}

export interface QuoteItem {
  id?: string;
  itemId?: string; // Referencia al catálogo, si aplica
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total?: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string; // Desnormalizado para búsquedas rápidas
  assetId?: string; // Vehículo opcional
  assetName?: string; // Desnormalizado
  items: QuoteItem[];
  subtotal?: number;
  taxAmount?: number;
  currency: string;
  total: number;
  status: "draft" | "sent" | "approved" | "rejected" | "invoiced";
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: "cash" | "card" | "transfer" | "other";
  date: Date;
  reference?: string; // Ej. Nro de transferencia
  createdBy?: string;
}

export interface SalesOrder {
  id: string;
  tenantId: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  assetId?: string;
  assetName?: string;
  items: QuoteItem[];
  subtotal?: number;
  taxAmount?: number;
  currency: string;
  total: number;
  status: "pending" | "paid" | "partial" | "cancelled";
  
  // Historial de cobros
  payments: Payment[];
  
  isPublic?: boolean; // Control de privacidad para el QR público
  notes?: string;
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
}
