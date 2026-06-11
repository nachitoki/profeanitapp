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

  if (!targetId) return;

  await setDoc(doc(db, 'students', targetId), {
    coins: 0,
    hasReceivedWelcomeGift: false
  }, { merge: true });

  console.log('Monedas de Benjamín en 0. Listo para recibir el regalo de bienvenida.');
}

resetBenjamin().catch(console.error);
