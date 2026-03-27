/**
 * Firebase Service - Share User Data with Team 2
 * 
 * This allows Team 2 to access real user profile data
 * without needing to build a backend API
 */

import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getFirestore, updateDoc } from 'firebase/firestore';

// Firebase configuration
// TODO: Replace with your Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Save user profile to Firebase
 * Team 2 can read this data directly from Firebase
 */
export async function saveUserProfileToFirebase(userProfile: any) {
    try {
        const docRef = await addDoc(collection(db, 'user_profiles'), {
            name: userProfile.name,
            ageGroup: userProfile.ageGroup,
            sittingHours: userProfile.sittingHours,
            height: userProfile.height ? parseInt(userProfile.height) : null,
            weight: userProfile.weight ? parseInt(userProfile.weight) : null,
            timestamp: new Date().toISOString(),
            createdAt: new Date(),
        });

        console.log('✅ User profile saved to Firebase:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
        throw error;
    }
}

/**
 * Update existing user profile
 */
export async function updateUserProfileInFirebase(userId: string, userProfile: any) {
    try {
        const docRef = doc(db, 'user_profiles', userId);
        await updateDoc(docRef, {
            name: userProfile.name,
            ageGroup: userProfile.ageGroup,
            sittingHours: userProfile.sittingHours,
            height: userProfile.height ? parseInt(userProfile.height) : null,
            weight: userProfile.weight ? parseInt(userProfile.weight) : null,
            updatedAt: new Date(),
        });

        console.log('✅ User profile updated in Firebase');
    } catch (error) {
        console.error('❌ Error updating Firebase:', error);
        throw error;
    }
}
