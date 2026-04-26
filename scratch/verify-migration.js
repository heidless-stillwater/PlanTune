const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'heidless-apps-0';
const app = initializeApp({ projectId });

async function verify() {
    const db0 = getFirestore(app, 'promptresources-db-0');
    const dbDefault = getFirestore(app);
    const dbTool = getFirestore(app, 'prompttool-db-0');

    try {
        const s0 = await db0.collection('resources').count().get();
        const sd = await dbDefault.collection('resources').count().get();
        const st = await dbTool.collection('resources').count().get();

        console.log(`promptresources-db-0: ${s0.data().count}`);
        console.log(`(default): ${sd.data().count}`);
        console.log(`prompttool-db-0: ${st.data().count}`);
    } catch (err) {
        console.log('Error:', err.message);
    }
}

verify();
