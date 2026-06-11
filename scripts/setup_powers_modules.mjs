import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "profeanitapp",
  appId: "1:392022580885:web:bc68a356460ba90349059c",
  storageBucket: "profeanitapp.firebasestorage.app",
  apiKey: "AIzaSyCJYSnZ2PinvNuv7r7T5MidGJPmXpZMnjI",
  authDomain: "profeanitapp.firebaseapp.com",
  messagingSenderId: "392022580885",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const powersModules = [
  {
    id: "powers_bot_1",
    title: "Misión: El Robot de las Potencias",
    description: "Ayuda a PotenciasBot a procesar la energía entendiendo cómo funcionan las potencias. ¡Completa la práctica final!",
    type: "powers_bot",
    theme: "Matemáticas 🤖",
    status: "unlocked",
    requiredLevel: 1,
    xpReward: 150
  },
  {
    id: "powers_bot_infinite",
    title: "Práctica Libre: Simulador de Potencias",
    description: "Entrena con PotenciasBot sin límites. Resuelve ejercicios de propiedades y fracciones para ganar XP y monedas rápidamente.",
    type: "powers_bot",
    theme: "Matemáticas 🤖",
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
