import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Asegúrate de tener estas variables de entorno en tu .env.local
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let app: App;

if (!getApps().length) {
  // Inicializa solo si hay credenciales (para evitar errores en build time)
  if (firebaseConfig.projectId) {
    app = initializeApp({
      credential: cert(firebaseConfig),
    });
  } else {
    // Fallback dummy app para build
    app = initializeApp({ projectId: 'dummy' });
  }
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
export const adminAuth = getAuth(app);
