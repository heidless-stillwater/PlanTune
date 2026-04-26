
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'heidless-apps-0',
};

const app = initializeApp(firebaseConfig);

async function check() {
  const dbTool = getFirestore(app, 'prompttool-db-0');
  const dbResources = getFirestore(app, 'promptresources-db-0');

  try {
    const snapTool = await getDocs(collection(dbTool, 'resources'));
    console.log(`Resources in prompttool-db-0: ${snapTool.size}`);
    
    const snapResources = await getDocs(collection(dbResources, 'resources'));
    console.log(`Resources in promptresources-db-0: ${snapResources.size}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
