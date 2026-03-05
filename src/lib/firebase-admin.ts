/**
 * Firebase Admin SDK (서버사이드 전용)
 * 소셜 로그인 Custom Token 발급에 사용
 * sykoreapanel과 동일한 Firebase 프로젝트 공유
 */
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

if (getApps().length === 0) {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonStr) {
    try {
      const serviceAccount = JSON.parse(jsonStr);
      app = initializeApp({ credential: cert(serviceAccount) });
    } catch (e) {
      console.warn("Firebase Admin init failed:", e);
    }
  } else {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (privateKey && clientEmail && projectId) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
  }
} else {
  app = getApps()[0];
}

export const adminAuth: Auth = app ? getAuth(app) : (null as unknown as Auth);
export const adminDb: Firestore = app ? getFirestore(app) : (null as unknown as Firestore);
