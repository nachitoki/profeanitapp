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

async function fixPedro() {
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  for (const student of studentsSnapshot.docs) {
    const data = student.data();
    if (data.name && data.name.toLowerCase().includes('pedro')) {
      console.log(`Fijando PIN 1234 a Pedro (ID: ${student.id})`);
      await setDoc(doc(db, 'students', student.id), { pin: '1234', isFirstLogin: true }, { merge: true });
      console.log('¡Listo!');
      return;
    }
  }
  console.log('No se encontró a Pedro.');
}

fixPedro().catch(console.error);
