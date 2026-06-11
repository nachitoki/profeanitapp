import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "profeanitapp",
  appId: "1:392022580885:web:bc68a356460ba90349059c",
  storageBucket: "profeanitapp.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function upload() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Error: Indica la ruta del archivo JSON (ej. public/preview.json)");
    process.exit(1);
  }
  
  const absolutePath = path.resolve(filePath);
  const data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  const id = data.id || `mod_${Date.now()}`;
  data.id = id;

  try {
    await setDoc(doc(db, "modules", id), data);
    console.log(`✅ ¡Módulo subido a la nube con éxito! ID: ${id}`);
    process.exit(0);
  } catch(e) {
    console.error("❌ Error al subir:", e);
    process.exit(1);
  }
}

upload();
