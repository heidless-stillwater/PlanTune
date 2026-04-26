const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'heidless-apps-0';
const app = initializeApp({ projectId }, 'test-app');
const db = getFirestore(app, 'promptresources-db-0');

async function test() {
    console.log('Fetching resources from promptresources-db-0...');
    const snapshot = await db.collection('resources').limit(5).get();
    console.log('Found:', snapshot.size);
    snapshot.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.data().title} [${doc.data().status}]`);
    });
}

test();
