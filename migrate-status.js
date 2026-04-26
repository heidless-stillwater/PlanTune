const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  try {
    const env = fs.readFileSync('/home/heidless/projects/PromptResources/.env.local', 'utf8');
    const getEnv = (key) => {
      const match = env.match(new RegExp('^' + key + '=(.*)$', 'm'));
      return match ? match[1].replace(/['\"]/g, '').trim() : null;
    };

    const serviceAccount = {
      projectId: getEnv('FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: getEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: getEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n')
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const { getFirestore } = require('firebase-admin/firestore');
    const resourcesDb = getFirestore(admin.app(), 'promptresources-db-0');
    
    const snap = await resourcesDb.collection('resources').get();
    console.log('Total resources found:', snap.size);
    
    let count = 0;
    let batch = resourcesDb.batch();
    let batchCount = 0;
    
    for (const doc of snap.docs) {
      if (!doc.data().status) {
        batch.update(doc.ref, { status: 'published' });
        count++;
        batchCount++;
        
        if (batchCount === 500) {
            await batch.commit();
            batch = resourcesDb.batch();
            batchCount = 0;
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log('Successfully updated', count, 'resources.');
  } catch (err) {
    console.error('Migration Error:', err);
    process.exit(1);
  }
}

run();
