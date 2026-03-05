/**
 * Firebase Admin SDK (서버사이드 전용)
 * 소셜 로그인 Custom Token 발급에 사용
 * sykoreapanel과 동일한 Firebase 프로젝트 공유
 */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonStr) {
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
