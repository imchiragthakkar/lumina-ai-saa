import { auth, googleProvider } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithPhoneNumber,
    RecaptchaVerifier
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Email/Password Signup
    const signupForm = document.querySelector('form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = signupForm.querySelector('.btn-submit');

            try {
                submitBtn.innerText = 'Creating Account...';
                submitBtn.disabled = true;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Email User:", userCredential.user.uid);
                window.location.href = 'onboarding.html';
            } catch (error) {
                console.error("Signup Error:", error);
                alert(error.message);
                submitBtn.innerText = 'Create Account';
                submitBtn.disabled = false;
            }
        });
    }

    // 2. Google Sign-In (Fixed Selector)
    const googleBtn = document.getElementById('googleBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, googleProvider);
                console.log("Google User:", result.user.uid);
                window.location.href = 'onboarding.html';
            } catch (error) {
                console.error("Google Auth Error:", error);
                alert(error.message);
            }
        });
    }

    // 3. Phone Authentication
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log("reCAPTCHA Solved");
        }
    });

    const phoneStartBtn = document.getElementById('phoneStartBtn');
    const phoneAuthSection = document.getElementById('phoneAuthSection');

    if (phoneStartBtn) {
        phoneStartBtn.addEventListener('click', () => {
            phoneAuthSection.style.display = 'block';
            phoneStartBtn.classList.add('active'); // Optional styling
        });
    }

    const sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            const phoneNumber = document.getElementById('phoneNumber').value;
            if (!phoneNumber) return alert("Please enter phone number");

            const appVerifier = window.recaptchaVerifier;

            try {
                sendOtpBtn.innerText = "Sending...";
                window.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

                // Show OTP Input
                document.getElementById('otpInputGroup').style.display = 'block';
                sendOtpBtn.innerText = "Code Sent!";
                sendOtpBtn.disabled = true;

            } catch (error) {
                console.error("SMS Error:", error);
                alert("Failed to send code: " + error.message);
                sendOtpBtn.innerText = "Send Code";
                // Reset recaptcha
                window.recaptchaVerifier.render().then(widgetId => {
                    grecaptcha.reset(widgetId);
                });
            }
        });
    }

    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const code = document.getElementById('otpCode').value;
            if (!code) return;

            try {
                verifyOtpBtn.innerText = "Verifying...";
                const result = await window.confirmationResult.confirm(code);
                console.log("Phone User:", result.user.uid);
                window.location.href = 'onboarding.html';
            } catch (error) {
                console.error("OTP Error:", error);
                alert("Invalid verification code");
                verifyOtpBtn.innerText = "Verify & Sign Up";
            }
        });
    }
});
