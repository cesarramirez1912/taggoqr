import { UserProfile } from "./types";
import { adminDb } from "../firebase/admin";

export interface IUserRepository {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  createUserProfile(profile: UserProfile): Promise<UserProfile>;
  updateUserRole(userId: string, tenantId: string, role: "admin" | "editor"): Promise<void>;
}

export class FirebaseUserRepository implements IUserRepository {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const doc = await adminDb.collection("users").doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as UserProfile;
  }

  async createUserProfile(profile: UserProfile): Promise<UserProfile> {
    await adminDb.collection("users").doc(profile.id).set(profile);
    return profile;
  }

  async updateUserRole(userId: string, tenantId: string, role: "admin" | "editor"): Promise<void> {
    await adminDb.collection("users").doc(userId).update({
      [`tenantRoles.${tenantId}`]: role
    });
  }
}

export const userRepository = new FirebaseUserRepository();
