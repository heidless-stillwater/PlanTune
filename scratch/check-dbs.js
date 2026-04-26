
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'heidless-apps-0',
};

const app = initializeApp(firebaseConfig);

async function check() {
  const db0 = getFirestore(app, 'promptresources-db-0');
  const dbDefault = getFirestore(app); // (default)

  try {
    const snap0 = await getDocs(collection(db0, 'resources'));
    console.log(`Resources in db-0: ${snap0.size}`);
    
    const snapDefault = await getDocs(collection(dbDefault, 'resources'));
    console.log(`Resources in (default): ${snapDefault.size}`);
  } catch (err) {
    console.error('Error checking databases:', err.message);
  }
}

check();
