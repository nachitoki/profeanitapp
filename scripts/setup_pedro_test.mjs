import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-YOUR-KEY-HERE",
  authDomain: "profeanitapp.firebaseapp.com",
  projectId: "profeanitapp",
  storageBucket: "profeanitapp.appspot.com",
  messagingSenderId: "38927429384",
  appId: "1:2398472384:web:239847239487"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  await updateDoc(doc(db, "students", "1"), {
    theme: "worldcup",
    coins: 500,
    hasReceivedWelcomeGift: true // Para que no le salga el cartel a Pedro tampoco y pruebes directo el álbum
  });
  console.log("Pedro configurado para pruebas!");
  process.exit(0);
}

run();
