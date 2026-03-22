import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBs0RgULlWdJBf3c2VHRNPkYTSr-XLSv2M",
    authDomain: "znstudioquotation.firebaseapp.com",
    projectId: "znstudioquotation",
    storageBucket: "znstudioquotation.firebasestorage.app",
    messagingSenderId: "615767113104",
    appId: "1:615767113104:web:05b0fd038a8be5c9758715",
    measurementId: "G-9SWV7KXYKM"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auto sign-in anonymously for simple authentication
export const initAuth = async () => {
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Firebase Auth Error:", error);
    }
};

export { onAuthStateChanged };
export default app;
