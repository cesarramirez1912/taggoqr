import { Asset } from "./types";
import { adminDb } from "../firebase/admin";

export interface IAssetRepository {
  getAssetById(tenantId: string, assetId: string): Promise<Asset | null>;
  listAssets(tenantId: string): Promise<Asset[]>;
  createAsset(asset: Omit<Asset, "id" | "createdAt">): Promise<Asset>;
}

// Implementación concreta usando Firebase
export class FirebaseAssetRepository implements IAssetRepository {
  async getAssetById(tenantId: string, assetId: string): Promise<Asset | null> {
    const doc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("assets")
      .doc(assetId)
      .get();
      
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Asset;
  }

  async listAssets(tenantId: string): Promise<Asset[]> {
    const snapshot = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("assets")
      .get();
      
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Asset)
    );
  }

  async createAsset(asset: Omit<Asset, "id" | "createdAt">): Promise<Asset> {
    const ref = adminDb
      .collection("tenants")
      .doc(asset.tenantId)
      .collection("assets")
      .doc();
      
    const newAsset: Asset = {
      ...asset,
      id: ref.id,
      createdAt: new Date(),
    };
    
    await ref.set(newAsset);
    return newAsset;
  }
}

// Instancia global. Si se cambia a Postgres, solo se actualiza aquí:
export const assetRepository = new FirebaseAssetRepository();
