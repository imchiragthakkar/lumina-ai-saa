import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(target).classList.add('active');
        });
    });

    // 2. Auth & Load Data
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Settings: User authenticated");
            loadUserSettings(user.uid);
        } else {
            console.log("Settings: No user");
            // window.location.href = 'login.html'; // Optional: redirect
        }
    });

    // 3. Logo Upload Preview
    const logoInput = document.getElementById('logoUpload');
    const logoPreview = document.getElementById('logoPreview');

    if (logoInput) {
        logoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                if (file.type !== 'image/png') {
                    alert('Please upload a PNG image.');
                    this.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    // Update preview box
                    logoPreview.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100px; object-fit:contain;">`;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // 4. Tone Tag Management (Visual only for now)
    document.querySelectorAll('.tone-tag').forEach(tag => {
        tag.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    });
});

// Load Data Function
async function loadUserSettings(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Populate Fields
            if (data.businessName) document.getElementById('brandName').value = data.businessName;
            if (data.industry) document.getElementById('brandIndustry').value = data.industry;
            if (data.description) document.getElementById('businessDesc').value = data.description;

            if (data.colors) {
                if (data.colors.primary) document.getElementById('brandPrimary').value = data.colors.primary;
                if (data.colors.secondary) document.getElementById('brandSecondary').value = data.colors.secondary;
                if (data.colors.text) document.getElementById('brandText').value = data.colors.text;
            }

            // Load API Keys
            if (data.geminiApiKey) document.getElementById('geminiKey').value = data.geminiApiKey;
            if (data.openaiApiKey) document.getElementById('openaiKey').value = data.openaiApiKey;

            // Load logo preview if exists (assuming base64 for MVP)
            if (data.logoBase64) {
                const logoPreview = document.getElementById('logoPreview');
                if (logoPreview) {
                    logoPreview.innerHTML = `<img src="${data.logoBase64}" style="max-width:100%; max-height:100px; object-fit:contain;">`;
                }
            }
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

// Save Settings Function (Global scope for onclick)
window.saveSettings = async function () {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save.");
        return;
    }

    const btn = event.target;
    // Simple state change
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        // Collect Data
        // Note: For a real app, separating Profile save vs Brand save is better. 
        // Here we'll grab Brand data specifically since that was requested.

        const brandUpdates = {
            businessName: document.getElementById('brandName').value,
            industry: document.getElementById('brandIndustry').value,
            description: document.getElementById('businessDesc').value,
            colors: {
                primary: document.getElementById('brandPrimary').value,
                secondary: document.getElementById('brandSecondary').value,
                text: document.getElementById('brandText').value
            },
            updatedAt: new Date().toISOString()
        };

        // Handle Image
        const logoInput = document.getElementById('logoUpload');
        if (logoInput && logoInput.files[0]) {
            const file = logoInput.files[0];
            const base64 = await convertToBase64(file);
            brandUpdates.logoBase64 = base64; // Storing image string in Firestore (MVP only! max 1MB doc limit)
        }

        // Save to Firestore (merge: true updates only provided fields)
        const geminiKey = document.getElementById('geminiKey')?.value;
        const openaiKey = document.getElementById('openaiKey')?.value;

        if (geminiKey !== undefined) brandUpdates.geminiApiKey = geminiKey;
        if (openaiKey !== undefined) brandUpdates.openaiApiKey = openaiKey;

        await setDoc(doc(db, "users", user.uid), brandUpdates, { merge: true });

        // Success Feedback
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        btn.style.background = '#10b981'; // Green
        btn.style.borderColor = '#10b981';

    } catch (error) {
        console.error("Save error:", error);
        alert("Failed to save: " + error.message);
        btn.innerHTML = 'Error';
        btn.style.background = '#ef4444'; // Red
    }

    // Reset button after delay
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.borderColor = '';
    }, 2000);
}

// Helper
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper: Toggle Password Visibility
window.toggleVisibility = function (id) {
    const el = document.getElementById(id);
    if (el.type === "password") {
        el.type = "text";
    } else {
        el.type = "password";
    }
}
