import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD_lte4T_tUDUxLwfbL2mVsKyyavmIvu1I",
  authDomain: "event-tracker-b65ff.firebaseapp.com",
  projectId: "event-tracker-b65ff",
  storageBucket: "event-tracker-b65ff.firebasestorage.app",
//   messagingSenderId: "265438173567",
  appId: "1:265438173567:web:566263226dc4326a4ee24a",
//   measurementId: "G-V5ZYBC5LGE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);