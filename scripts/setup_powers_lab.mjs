import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

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

const powersLabModule = {
  id: "powers_lab_01",
  type: "powers_lab",
  title: "Módulo II: Laboratorio de Potencias",
  theme: "Exploración Infinita",
  xpReward: 0, // Las recompensas se dan por pregunta en este módulo infinito
  explanation: [
    {
      type: "text",
      content: "¡Bienvenido al Laboratorio de Potencias Avanzado! Aquí podrás practicar multiplicación, división, potencias de potencias y mucho más."
    },
    {
      type: "highlight",
      title: "Mecánicas Especiales",
      content: "Este módulo es infinito. Puedes elegir entre Modo Aventura, Práctica Aislada o la Arena de Combinados. ¡Obtén multiplicadores de XP al no equivocarte!"
    }
  ],
  games: []
};

async function installPowersLab() {
  console.log('Instalando Laboratorio de Potencias...');

  await setDoc(doc(db, 'modules', powersLabModule.id), powersLabModule, { merge: true });
  console.log(`Módulo guardado en 'modules/${powersLabModule.id}'`);

  const studentsSnapshot = await getDocs(collection(db, 'students'));
  for (const studentDoc of studentsSnapshot.docs) {
    const studentId = studentDoc.id;
    const studentData = studentDoc.data();
    let assignedModules = studentData.assignedModules || [];

    const studentModRef = doc(db, `students/${studentId}/modules`, powersLabModule.id);
    await setDoc(studentModRef, powersLabModule, { merge: true });

    if (!assignedModules.includes(powersLabModule.id)) {
      assignedModules.push(powersLabModule.id);
    }

    await setDoc(doc(db, 'students', studentId), { assignedModules }, { merge: true });
    console.log(`Laboratorio asignado al estudiante ${studentId}.`);
  }

  console.log('¡Laboratorio instalado exitosamente!');
}

installPowersLab().catch(console.error);
