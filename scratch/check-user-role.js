const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'heidless-apps-0';
const app = initializeApp({ projectId });
const db = getFirestore(app, 'prompttool-db-0');

async function checkUser() {
    const email = 'heidlessemail18@gmail.com';
    const snapshot = await db.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
        console.log(`User ${email} not found in prompttool-db-0`);
        return;
    }
    
    snapshot.docs.forEach(doc => {
        console.log(`User: ${doc.id}`);
        console.log(`Role: ${doc.data().role}`);
        console.log(`Email: ${doc.data().email}`);
    });
}

checkUser();
