import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "profeanitapp",
  appId: "1:392022580885:web:bc68a356460ba90349059c",
  storageBucket: "profeanitapp.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function patch() {
  console.log("Revisando base de datos...");
  const snap = await getDocs(collection(db, "students"));
  
  for (const d of snap.docs) {
    const data = d.data();
    if (data.curso === undefined) {
      console.log(`Actualizando a ${data.name} para añadirle el campo curso...`);
      await updateDoc(doc(db, "students", d.id), { curso: '3ro Básico' });
    }
  }
  console.log("¡Listo! Todos los perfiles antiguos ahora tienen el campo Curso.");
  process.exit(0);
}

patch();
