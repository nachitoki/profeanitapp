import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "profeanitapp",
  appId: "1:392022580885:web:bc68a356460ba90349059c",
  storageBucket: "profeanitapp.firebasestorage.app",
  apiKey: "AIzaSyCJYSnZ2PinvNuv7r7T5MidGJPmXpZMnjI",
  authDomain: "profeanitapp.firebaseapp.com",
  messagingSenderId: "392022580885",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
