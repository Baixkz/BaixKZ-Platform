
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAwBHnzDKwuXvElMSdrBGrmzxbrB22bhDo",
  authDomain: "baix-kz.firebaseapp.com",
  projectId: "baix-kz",
  storageBucket: "baix-kz.firebasestorage.app",
  messagingSenderId: "799968042014",
  appId: "1:799968042014:web:e336302c25fec999a8620f",
  measurementId: "G-5W2G0RCBY2",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Әкімшінің Firebase Authentication UID-і.
// Бұл мән Gmail мекенжайы немесе телефон нөмірі емес.
export const MASTER_ADMIN_UID = "u3YhoxScfghCdlMzHKOFQvzyjIz1";

export default app;
