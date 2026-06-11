import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "profeanitapp",
  appId: "1:392022580885:web:bc68a356460ba90349059",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Configurando módulos de entrenamiento infinito...");

  // 1. Crear el módulo infinito de Tablas Visuales
  await setDoc(doc(db, "modules", "visual_grid_infinite"), {
    id: "visual_grid_infinite",
    type: "grid_math",
    title: "Práctica Libre: Tablas Visuales",
    theme: "Entrenamiento Montessori",
    xpReward: 0,
    explanation: [],
    games: [],
    isInfinite: true
  });

  // 2. Modificar el módulo de penales para que sea infinito
  await updateDoc(doc(db, "modules", "football_math_1"), {
    isInfinite: true
  }).catch(() => console.log("El modulo football_math_1 no existe aún, ignorando."));

  // 3. Asignar el nuevo módulo infinito a todos los alumnos existentes para que lo vean
  const studentsSnap = await getDocs(collection(db, "students"));
  for (const student of studentsSnap.docs) {
    const data = student.data();
    if (!data.assignedModules.includes("visual_grid_infinite")) {
      await updateDoc(student.ref, {
        assignedModules: [...data.assignedModules, "visual_grid_infinite"]
      });
    }
  }

  console.log("¡Listo!");
}

run();
