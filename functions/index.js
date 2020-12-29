const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const collectionName = 'users'

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// auth trigger (user creation) 
exports.userRegister = functions.auth.user().onCreate(user => {
    var providerId = user.providerData[0].providerId
   return admin.firestore().collection(collectionName).doc(user.uid).set({
       email: user.email,
       name: user.displayName,
       profileUrl: user.photoURL,
       provider: providerId,
       createdAt: admin.firestore.FieldValue.serverTimestamp()
   });
});

// auth trigger (user deleted)
exports.userDelete = functions.auth.user().onDelete(user => {
    // for background triggers you must return a promise/value
    var doc = admin.firestore().collection(collectionName).doc(user.uid);
    return doc.delete();
});