import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const userCollection = 'users'

// auth trigger (user creation)
export const userRegister = functions.auth.user().onCreate(user => {
    const providerId = user.providerData[0].providerId;
    return admin.firestore().collection(userCollection).doc(user.uid).set({
        email: user.email,
        name: user.displayName,
        profileUrl: user.photoURL,
        provider: providerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
})

// auth trigger (user deleted)
export const userDelete = functions.auth.user().onDelete(user => {
    // for background triggers you must return a promise/value
    const doc = admin.firestore().collection(userCollection).doc(user.uid);
    return doc.delete();
});