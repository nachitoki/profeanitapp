import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';

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
  const updates = [];
  querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id} | Name: ${data.name} | Theme: ${data.theme || 'none'} | Coins: ${data.coins}`);
      
      if (data.name.includes("Benj") || data.name === "Pedro") {
         updates.push(updateDoc(doc.ref, { theme: "worldcup" }));
         console.log(`=> Forced worldcup theme for ${data.name}`);
      }
  });
  await Promise.all(updates);
  console.log("Done");
  process.exit(0);
}

run();
