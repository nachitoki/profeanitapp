import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkPedro() {
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  for (const doc of studentsSnapshot.docs) {
    const data = doc.data();
    if (data.name && data.name.toLowerCase().includes('pedro')) {
      console.log(`Pedro PIN: ${data.pin}`);
      return;
    }
  }
  console.log('No se encontró a Pedro en la base de datos.');
}

checkPedro().catch(console.error);
