import { auth, googleProvider } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('form');
    const googleBtn = document.querySelector('.social-login .btn-icon'); // Assuming there's a Google button

    // Handle Email/Password Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            try {
                // Loading state
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Creating Account...';
                submitBtn.disabled = true;

                // Create User
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log("User created:", user.uid);

                // Redirect to Onboarding
                window.location.href = 'onboarding.html';

            } catch (error) {
                console.error("Signup Error:", error);
                alert(error.message);
                submitBtn.innerText = 'Create Account'; // Reset
                submitBtn.disabled = false;
            }
        });
    }

    // Handle Google Sign In (if button exists)
    // We might need to select it specifically if it lacks an ID
    const googleButtons = document.querySelectorAll('.social-login button, .btn-google');
    // Assuming the Google button is the one with the Google icon
    // Let's rely on finding one with text or icon class if specific ID is missing
    // or just assume it's the first button in social-login if exists.

    // Actually, let's update signup.html to give it an ID for certainty in next step.
    // For now, let's try to grab it via the class structure from previous `signup.html` creation knowledge.
    const googleButton = document.querySelector('.btn-outline'); // Standard social button class often used

    if (googleButton) {
        googleButton.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent accidental form submission
            try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                console.log("Google User:", user.uid);
                window.location.href = 'onboarding.html';
            } catch (error) {
                console.error("Google Auth Error:", error);
                alert(error.message);
            }
        });
    }
});
