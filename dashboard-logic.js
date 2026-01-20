import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // No user, redirect to login
            console.log("No user found, redirecting...");
            // window.location.href = 'index.html'; // Uncomment to enforce auth
        } else {
            console.log("Dashboard auth user:", user.uid);
            // Fetch User Profile
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    updateDashboard(data);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error getting document:", error);
            }
        }
    });

    function updateDashboard(data) {
        // Update Workspace Name
        const workspaceEl = document.querySelector('.user-info .workspace');
        if (workspaceEl && data.businessName) {
            workspaceEl.textContent = data.businessName;

            // Also update welcome text with bold company name
            const welcomeP = document.querySelector('.welcome-text p');
            if (welcomeP) {
                welcomeP.innerHTML = `Ready to create some viral content for <strong>${data.businessName}</strong> today?`;
            }
        }

        // Update User Name (if stored, or use part of email)
        // For now, we didn't explicitly store First/Last on signup, only business details.
        // We could extract from Social Auth or just keep placeholder/email.
    }

    // Logout Functionality
    // We need to add a logout button to the UI first or attach to existing element
    // Let's create a logout handler that can be called
    window.handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("Signed out");
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Sign out error", error);
        }
    };
});
