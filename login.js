import { auth, googleProvider } from "./firebase-config.js";
import { signInWithEmailAndPassword, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Email/Password Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('.btn-submit');

    try {
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        await signInWithEmailAndPassword(auth, email, password);

        // Success: Redirect
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error("Login Error:", error);
        submitBtn.textContent = 'Log In';
        submitBtn.disabled = false;

        // Simple error handling
        let msg = "Failed to log in.";
        if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        alert(msg);
    }
});

// Google Login
googleLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Google Login Error:", error);
        alert("Google sign-in failed. Please try again.");
    }
});
