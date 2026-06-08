import { QRTag } from "./types";
import { adminDb } from "../firebase/admin";

export interface IQRTagRepository {
  getQRTag(qrId: string): Promise<QRTag | null>;
  createQRBatch(tenantId: string, count: number): Promise<QRTag[]>;
  assignQRToAsset(qrId: string, assetId: string): Promise<void>;
  listTenantQRs(tenantId: string): Promise<QRTag[]>;
}

export class FirebaseQRTagRepository implements IQRTagRepository {
  async getQRTag(qrId: string): Promise<QRTag | null> {
    const doc = await adminDb.collection("qrTags").doc(qrId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as QRTag;
  }

  async createQRBatch(tenantId: string, count: number): Promise<QRTag[]> {
    const batch = adminDb.batch();
    const newTags: QRTag[] = [];

    for (let i = 0; i < count; i++) {
      const ref = adminDb.collection("qrTags").doc();
      const qrTag: QRTag = {
        id: ref.id,
        tenantId,
        assetId: null,
        status: "printed",
        createdAt: new Date(),
      };
      batch.set(ref, qrTag);
      newTags.push(qrTag);
    }

    await batch.commit();
    return newTags;
  }

  async assignQRToAsset(qrId: string, assetId: string): Promise<void> {
    await adminDb.collection("qrTags").doc(qrId).update({
      assetId,
      status: "assigned"
    });
  }

  async listTenantQRs(tenantId: string): Promise<QRTag[]> {
    const snapshot = await adminDb.collection("qrTags").where("tenantId", "==", tenantId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QRTag));
  }
}

export const qrTagRepository = new FirebaseQRTagRepository();
