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
                    // Ensure we still update the name even if no brand profile exists yet
                    updateDashboard({});
                }
            } catch (error) {
                console.error("Error getting document:", error);
            }
        }
    });

    function updateDashboard(data) {
        // 1. Update User Name (from Auth or Fallback)
        const user = auth.currentUser;
        let displayName = "User";

        if (user && user.displayName) {
            displayName = user.displayName;
        } else if (user && user.email) {
            displayName = user.email.split('@')[0]; // fallback to email prefix
        }

        // Update all name fields (sidebar and greeting)
        // Sidebar Name
        const sidebarNameEl = document.querySelector('.user-info .name');
        if (sidebarNameEl) sidebarNameEl.textContent = displayName;

        // Greeting Header
        const greetingH1 = document.querySelector('.welcome-text h1');
        if (greetingH1) {
            const firstName = displayName.split(' ')[0];
            greetingH1.textContent = `Good morning, ${firstName}! 👋`;
        }

        // 2. Update Avatar (Initials)
        const avatarEl = document.querySelector('.avatar');
        if (avatarEl) {
            const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }

        // 3. Update Workspace/Company Name (from Firestore)
        if (data.businessName) {
            const workspaceEl = document.querySelector('.user-info .workspace');
            if (workspaceEl) workspaceEl.textContent = data.businessName;

            // Update welcome message paragraph
            const welcomeP = document.querySelector('.welcome-text p');
            if (welcomeP) {
                welcomeP.innerHTML = `Ready to create some viral content for <strong>${data.businessName}</strong> today?`;
            }
        }
    }

    // Logout Functionality
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
