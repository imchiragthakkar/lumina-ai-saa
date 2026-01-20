// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhxRv3IXrOz4mNtALvUZ25NxQUwkMUVkE",
    authDomain: "luminaai-aafa2.firebaseapp.com",
    projectId: "luminaai-aafa2",
    storageBucket: "luminaai-aafa2.firebasestorage.app",
    messagingSenderId: "957431965114",
    appId: "1:957431965114:web:2f251467915cf83d6e6983",
    measurementId: "G-H9PXNJELJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };
