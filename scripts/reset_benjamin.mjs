import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyFakeKeyForLocalDev_replaceIfNeeded",
  authDomain: "profeanitapp.firebaseapp.com",
  projectId: "profeanitapp",
  storageBucket: "profeanitapp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetBenjamin() {
  console.log('Buscando a Benjamín...');
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  let targetId = null;
  
  for (const doc of studentsSnapshot.docs) {
    const data = doc.data();
    if (data.name && data.name.toLowerCase().includes('benjamín')) {
      targetId = doc.id;
      break;
    } else if (doc.id === '1') {
      targetId = '1';
    }
  }

  if (!targetId) {
    console.error('No se encontró a Benjamín.');
    return;
  }

  console.log(`Reiniciando datos para el ID: ${targetId}`);

  // Conservamos el nombre, pin y módulos asignados, pero limpiamos el progreso
  await setDoc(doc(db, 'students', targetId), {
    xp: 0,
    level: 1,
    skills: {}, // Limpiar el radar de habilidades
    completedModules: [] // Quitar las misiones completadas
  }, { merge: true });

  console.log('¡El perfil de Benjamín ha sido reiniciado a nivel 1 con 0 XP!');
}

resetBenjamin().catch(console.error);
