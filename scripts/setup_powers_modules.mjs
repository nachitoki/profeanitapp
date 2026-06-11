import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

// Usa la configuración real de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyB...", // Será inyectado o puedes pasar un env dummy
  authDomain: "profeanitapp.firebaseapp.com",
  projectId: "profeanitapp",
  storageBucket: "profeanitapp.appspot.com",
  messagingSenderId: "374249080277",
  appId: "1:374249080277:web:cff2f0cbdb0f269a8385a4",
  measurementId: "G-9DNDHXY4T0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const powersModules = [
  {
    id: "powers_bot_1",
    title: "Misión: El Robot de las Potencias",
    description: "Ayuda a PotenciasBot a procesar la energía entendiendo cómo funcionan las potencias. ¡Completa la práctica final!",
    type: "powers_bot",
    status: "unlocked",
    requiredLevel: 1,
    xpReward: 150
  },
  {
    id: "powers_bot_infinite",
    title: "Práctica Libre: Simulador de Potencias",
    description: "Entrena con PotenciasBot sin límites. Resuelve ejercicios de propiedades y fracciones para ganar XP y monedas rápidamente.",
    type: "powers_bot",
    isInfinite: true,
    status: "unlocked",
    requiredLevel: 1
  }
];

async function setupPowersBot() {
  console.log('Iniciando configuración de PotenciasBot...');

  // 1. Añadir a la colección principal de modulos (plantillas)
  for (const mod of powersModules) {
    const modRef = doc(db, 'modules', mod.id);
    await setDoc(modRef, mod, { merge: true });
    console.log(`Módulo plantilla ${mod.id} actualizado.`);
  }

  // 2. Asignar los módulos a todos los estudiantes existentes
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  for (const studentDoc of studentsSnapshot.docs) {
    const studentId = studentDoc.id;
    for (const mod of powersModules) {
      const studentModRef = doc(db, `students/${studentId}/modules`, mod.id);
      await setDoc(studentModRef, mod, { merge: true });
      console.log(`Módulo ${mod.id} asignado al estudiante ${studentId}.`);
    }
  }

  console.log('¡Módulos de PotenciasBot instalados correctamente en la base de datos!');
  process.exit(0);
}

setupPowersBot().catch(console.error);
