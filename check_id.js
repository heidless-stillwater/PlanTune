const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDCy4uAE1uGo9YD\nimM/zecBp+c6c91EmhrqqysxGAQmzdLhPGqgLhI3I9te7ccqPXygutAXmNNbi/Ti\nYwidjX/S4V9tBqSpJ+PaIGqS4oFcmvrSUG7cwO4Hb6FOAdtf8bw29MdGBBcZmtQV\na5yv+Bp/Dy2sDZt4RTjUBoY7aDV/AijxYbcX08LzT2fqjL/Uq5fKOU4Z8VPOiHiW\nWopxcGMBdzgsP7eQsFaqwT2c0cGdzS9oVRatCtxYOzkCQpFzG95C4Co+RGTmn48W\nixPme9Zqs0+yNb981+fEQO3+1bBPkqRlX/4H49ZZJx1b+rAV0yECpoJxsIYorR5Z\ntwsqGnfPAgMBAAECggEAAh47CF2J9p/9/ZP56733Bsuja2gDc4cDAD90HNUL9vRG\nGHYaGu1xwyZIfxZ5Ihi51pTojHSxO6aLU5/2mr2+MnX75SWmLbTpf9hogEEmlmPN\nryuknWbiFtB/wa5xYGIykzlKtL8jMdTNUlb4tpQCjU0/AUb77xCwSlV3mvbDK+3a\nzB2fRmUF9yJ5hbJQopnuTrZECQS/s6qqgl7CHl9DjAPsALwL6gsJ9JXkknAm+wq2\nAdL7RbDZ0HUcQvHcizr9m8T1BKCJ6BSXQz8hZu9EhzMMC/eAz20aC22OfKukRvPQ\nQacLYNIdlYsNCwSLV/HD1NikmzO1hlKUxN2mP2xetQKBgQD+Lh85Vo5ZvOW5c58K\nH23bjJHk4z2nRwKfkJi9XlBxl0MNl5rTjE5dwXIcOi8gPO6pCC2g7hmUEtBhX8if\nCNDUbGR2STd4Xr/5v9areWpsX/Ecg3tinK0/ERgaI4AyVkOpxEZpY6lRUk55s/Rs\nK0p/TAlxsD8Z3C2210MNr+9hjQKBgQDEMJP/p6hkgW+nBMSY2+VVqnAolnAJiymo\nq+PpxGnBp7SMiaZGMp8+XC5xUUqGhnDmBW35/CEPR8eMRhZC5HFqXFE6pI9RGIJb\nQnxfYbX7AhHiG8o6xeTL/qTRD5jtvoUW9jZJ/M3Suce5U250mPd6hBbdmW8WG/ZC\nuezqCDTRywKBgQDctJu0I+5TCWzHzReJqKSxgKul/ZMpTsV+XAXkWKKtH1S/1qY/\njpL1YeV9kSAedAofh9Rm6pgXNQbvpkYDoZoC+WN6OjUKNeuoJuV122WHWP95bMmU\ZMsh+evdtnm4O6NhI+an2DvLOxadIp7X1fdH9XQ13X3NLJwdKWk111CaeQKBgEC0\nwOtN8aUMZ7XPRcQgqnfhmdJZI6SSKHBAGRBtvm+nj03WzGdUpN7dalfndsv9pVjI\K6iKdqDijLcAGrF/RMTOo9/SjI4zpjLRL9IJmQqreRh5D+7oe/ioCNYG7epjruOO\n2wL2BTBeI7hFAyYjmWPoEt6Nj2zcVhFV3wSlJj6XAoGANAkt6J6uUKvobwLh4PBA\nPAVJUpD1oqMWg9PTu3bwMFDzV5HUeBnyDCH5HSDyVPyonVwfo2lz+W1pNiGw1RHA\narxJl2NxLXtF8iqkyf/1tGT6LRwaTiXi5peWl3SqCzQ51d7PPLfweR+Oyhiu6Vm2\ny715iQJe5MJ7eWCnfzz7gdo=\n-----END PRIVATE KEY-----\n`;

const app = initializeApp({
    credential: cert({
        projectId: 'heidless-apps-0',
        clientEmail: 'videosystem-sa@heidless-apps-0.iam.gserviceaccount.com',
        privateKey: privateKey.replace(/\\n/g, '\n')
    })
});

const dbDefault = getFirestore(app);
const dbPartition = getFirestore(app, 'prompttool-db-0');

const userId = 'nNdenyyfKaN9yNB9Ly3vhhaHLXx1';
const imageId = 'sG3P4RP4qrAuXCOgtDLG';

async function check() {
    console.log('--- Checking Image ---');
    
    const ref1 = dbPartition.collection('users').doc(userId).collection('images').doc(imageId);
    const snap1 = await ref1.get();
    console.log(`prompttool-db-0: ${snap1.exists ? 'FOUND' : 'NOT FOUND'}`);
    
    const ref2 = dbDefault.collection('users').doc(userId).collection('images').doc(imageId);
    const snap2 = await ref2.get();
    console.log(`(default): ${snap2.exists ? 'FOUND' : 'NOT FOUND'}`);

    console.log('--- Checking for ANY images for this user ---');
    const snap3 = await dbPartition.collection('users').doc(userId).collection('images').limit(10).get();
    console.log(`prompttool-db-0 images count: ${snap3.size}`);
    snap3.forEach(d => console.log(` - ${d.id}`));

    const snap4 = await dbDefault.collection('users').doc(userId).collection('images').limit(10).get();
    console.log(`(default) images count: ${snap4.size}`);
    snap4.forEach(d => console.log(` - ${d.id}`));
    
    console.log('--- Checking leagueEntries ---');
    const snap5 = await dbPartition.collection('leagueEntries').where('originalUserId', '==', userId).get();
    console.log(`leagueEntries for user: ${snap5.size}`);
    snap5.forEach(d => {
        const data = d.data();
        console.log(` - Entry ${d.id}: originalImageId=${data.originalImageId}, title=${data.title}`);
    });
}

check().catch(console.error);
