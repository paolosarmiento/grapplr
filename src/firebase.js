import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHICgM2ZJ81cM6AuI1w5guyTPY-ZbriAw",
  authDomain: "grappl-c82d8.firebaseapp.com",
  projectId: "grappl-c82d8",
  storageBucket: "grappl-c82d8.firebasestorage.app",
  messagingSenderId: "993017289711",
  appId: "1:993017289711:web:87f21ae5386b02ee74f41a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
