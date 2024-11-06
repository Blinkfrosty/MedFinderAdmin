import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.database();

// Helper function to check if the user is a system admin
async function isSystemAdmin(uid: string): Promise<boolean> {
    const userSnapshot = await db.ref(`/users/${uid}`).once("value");
    const user = userSnapshot.val();
    return user?.isSystemAdmin === true;
}

export const createUser = functions.https.onCall(async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Request had invalid credentials."
        );
    }

    // Authorization check
    if (!(await isSystemAdmin(request.auth.uid))) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "User does not have sufficient permissions."
        );
    }

    try {
        // Create the user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: request.data.email,
            password: request.data.password,
        });

        return { uid: userRecord.uid };
    } catch (error: any) {
        throw new functions.https.HttpsError("unknown", error.message, error);
    }
});

export const updateUser = functions.https.onCall(async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Request had invalid credentials."
        );
    }

    // Authorization check
    if (!(await isSystemAdmin(request.auth.uid))) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "User does not have sufficient permissions."
        );
    }

    try {
        // Update the user in Firebase Auth
        await admin.auth().updateUser(request.data.uid, {
            email: request.data.email || undefined,
            password: request.data.password || undefined,
        });

        return { message: "User updated successfully" };
    } catch (error: any) {
        throw new functions.https.HttpsError("unknown", error.message, error);
    }
});

export const deleteUser = functions.https.onCall(async (request) => {
    // Authentication check
    if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Request had invalid credentials."
        );
    }

    // Authorization check
    if (!(await isSystemAdmin(request.auth.uid))) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "User does not have sufficient permissions."
        );
    }

    try {
        // Delete the user from Firebase Auth
        await admin.auth().deleteUser(request.data.uid);

        return { message: "User deleted successfully" };
    } catch (error: any) {
        throw new functions.https.HttpsError("unknown", error.message, error);
    }
});