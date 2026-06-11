import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

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
  const querySnapshot = await getDocs(collection(db, "students"));
  querySnapshot.forEach(doc => {
      console.log(doc.id, "=>", doc.data().name);
      if (doc.data().name.includes("Benj")) {
        updateDoc(doc.ref, { theme: "worldcup" });
        console.log("Updated!");
      }
  });
  process.exit(0);
}

run();
