
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'heidless-apps-0',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'promptresources-db-0');

async function check() {
  try {
    const snap = await getDocs(collection(db, 'resources'));
    console.log(`Resources count: ${snap.size}`);
  } catch (err) {
    console.error('Error fetching resources:', err);
  }
}

check();
