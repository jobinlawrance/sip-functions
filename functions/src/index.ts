import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const algoliasearch = require('algoliasearch');

admin.initializeApp();
const db = admin.firestore();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const userCollection = 'users'
const eventExpenses = 'event_expenses';
const events = 'events'

// auth trigger (user creation)
export const userRegister = functions.auth.user().onCreate(user => {
    const providerId = user.providerData[0].providerId;
    return db.collection(userCollection).doc(user.uid).set({
        email: user.email,
        name: user.displayName,
        profileUrl: user.photoURL,
        provider: providerId,
        createdOn: admin.firestore.FieldValue.serverTimestamp(),
    });
})

// auth trigger (user deleted)
export const userDelete = functions.auth.user().onDelete(user => {
    // for background triggers you must return a promise/value
    const doc = db.collection(userCollection).doc(user.uid);
    return doc.delete();
});

// -----------------------------------------------------------------------
// Functions related to users and algolia indexing
// -----------------------------------------------------------------------
const client = algoliasearch(functions.config().algolia.appid, functions.config().algolia.apikey);
const index = client.initIndex('user_search');

export const indexUser = functions.firestore.document(`${userCollection}/{userId}`).onCreate(async (snap, context) => {
    const data = snap.data();
    const objectId = snap.id;

    // Add the data to the algolia index
    return await index.saveObject({
        objectID: objectId,
        ...data,
    }).catch((err: any) => console.error(err));
});

export const unindexUser = functions.firestore.document(`${userCollection}/{userId}`).onDelete(async (snap, context) => {
    const objectId = snap.id;

    // Add the data to the algolia index
    return await index.deleteObject(objectId).catch((err: any) => console.error(err));
});

// -----------------------------------------------------------------------
// Functions related to event collection
// -----------------------------------------------------------------------

export const addDateToEvent = functions.firestore.document(`${events}/{eventId}`).onCreate((snapshot, context) => {
    return snapshot.ref.set({
        createdOn: admin.firestore.FieldValue.serverTimestamp(),
    },
        { merge: true }
    );
});


// -----------------------------------------------------------------------
// Functions related to event_expense collection
// -----------------------------------------------------------------------

export const addExpenseToEvent = functions.firestore
    .document(`${eventExpenses}/{expenseId}`)
    .onWrite(async (change, context) => {
        const amount = change.after.data()?.amount
        const eventId = change.after.data()?.eventId
        const eventRef = db.collection(events).doc(eventId)

        try {
            const snap = await eventRef.get()
            const currentAmount = snap.data()?.totalExpense ?? 0

            const totalAmount = currentAmount + amount

            functions.logger.log("Current Amount", currentAmount);
            functions.logger.log("amount", amount);
            functions.logger.log("totalAmount", totalAmount);

            await eventRef.update({
                totalExpense: totalAmount,
            })
        } catch (error) {
            functions.logger.error("Error adding expense", error)
        }
    });

