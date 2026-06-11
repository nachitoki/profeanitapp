import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "profeanitapp",
  appId: "1:392022580885:web:bc68a356460ba90349059c",
  storageBucket: "profeanitapp.firebasestorage.app"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadAndAssign() {
  const moduleId = "world_cup_26";
  const moduleData = {
    id: moduleId,
    type: "football_math",
    title: "MathWorldCup '26",
    theme: "Fútbol ⚽",
    xpReward: 0,
    explanation: [],
    games: []
  };

  try {
    await setDoc(doc(db, "modules", moduleId), moduleData);
    console.log(`✅ Módulo '${moduleData.title}' subido a Firebase.`);

    const snap = await getDocs(collection(db, "students"));
    let benjaminId = null;
    let currentAssigned = [];
    
    for (const d of snap.docs) {
      const data = d.data();
      if (data.name && data.name.toLowerCase().includes("benjam")) {
        benjaminId = d.id;
        currentAssigned = data.assignedModules || [];
        break;
      }
    }

    if (benjaminId) {
      if (!currentAssigned.includes(moduleId)) {
        await updateDoc(doc(db, "students", benjaminId), {
          assignedModules: [...currentAssigned, moduleId]
        });
        console.log(`✅ Módulo asignado exitosamente a Benjamín (ID: ${benjaminId})`);
      } else {
        console.log(`⚠️ Benjamín ya tenía el módulo asignado.`);
      }
    } else {
      console.log(`❌ No se encontró ningún estudiante llamado Benjamín.`);
    }

    process.exit(0);
  } catch(e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

uploadAndAssign();
