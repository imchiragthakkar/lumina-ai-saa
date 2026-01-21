
import { db, auth } from "./firebase-config.js";
import { AIService } from "./ai-service.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Configuration & Templates ---
const TEMPLATES = [
    {
        id: 'modern_bold',
        bg: '#1e293b', // Dark Slate
        textColor: '#ffffff',
        accentColor: '#6366f1', // Indigo
        font: 'bold 48px "Plus Jakarta Sans", sans-serif',
        textAlign: 'center',
        layout: 'center'
    },
    {
        id: 'vibrant_gradient',
        bg: 'linear-gradient(135deg, #6366f1, #ec4899)',
        textColor: '#ffffff',
        accentColor: '#fbbf24', // Amber
        font: 'bold 52px "Plus Jakarta Sans", sans-serif',
        textAlign: 'left',
        layout: 'hero'
    },
    {
        id: 'minimal_light',
        bg: '#ffffff',
        textColor: '#1e293b',
        accentColor: '#10b981', // Emerald
        font: '500 42px "Plus Jakarta Sans", sans-serif',
        textAlign: 'center',
        layout: 'clean'
    },
    {
        id: 'midnight_neon',
        bg: '#000000',
        textColor: '#00ffcc', // Neon Green
        accentColor: '#ff00ff', // Neon Pink
        font: 'bold 55px "Plus Jakarta Sans", sans-serif',
        textAlign: 'right',
        layout: 'bold'
    }
];

// --- State ---
let currentTopic = "";
let currentHeadline = "Welcome to Lumina";
let currentTemplate = TEMPLATES[0];
let userProfile = null;
let logoImage = null; // Image object for canvas

// --- DOM Elements ---
const chatContainer = document.getElementById('chatContainer');
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const autoMagicBtn = document.getElementById('autoMagicBtn');
const canvas = document.getElementById('magicCanvas');
const ctx = canvas.getContext('2d');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth & Data Fetching
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    userProfile = docSnap.data();
                    console.log("Magic Generator: Loaded Profile", userProfile);

                    // Pre-load logo if available
                    if (userProfile.logoBase64) {
                        const img = new Image();
                        img.src = userProfile.logoBase64;
                        img.onload = () => {
                            logoImage = img;
                            renderCanvas(); // Re-render with logo
                        };
                    }
                }
            } catch (err) {
                console.error("Error loading profile:", err);
            }
        }
    });

    // 2. Ensure fonts are loaded
    document.fonts.ready.then(() => {
        renderCanvas();
    });

    // Event Listeners
    generateBtn.addEventListener('click', () => handleGenerate(topicInput.value));

    topicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGenerate(topicInput.value);
    });

    if (autoMagicBtn) {
        autoMagicBtn.addEventListener('click', handleAutoPilot);
    }

    document.getElementById('remixTemplate').addEventListener('click', remixTemplate);
    document.getElementById('remixColor').addEventListener('click', remixColor);
    document.getElementById('remixText').addEventListener('click', remixText);
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
});

// --- Auto Pilot Logic ---
async function handleAutoPilot() {
    let prompt = "Monday Motivation"; // Default

    // SMART PROMPT: Based on Industry
    if (userProfile && userProfile.industry) {
        const ind = userProfile.industry.toLowerCase();
        const businessParams = userProfile.businessName ? ` for ${userProfile.businessName}` : "";

        if (ind.includes('food') || ind.includes('restaurant')) {
            const foodPrompts = ["Daily Special Deal", "Fresh Ingredients Spotlight", "Dinner Invitation" + businessParams];
            prompt = foodPrompts[Math.floor(Math.random() * foodPrompts.length)];
        } else if (ind.includes('tech') || ind.includes('software')) {
            const techPrompts = ["New Feature Announcement", "Tech Tip of the Day", "Upgrade Alert" + businessParams];
            prompt = techPrompts[Math.floor(Math.random() * techPrompts.length)];
        } else if (ind.includes('fit') || ind.includes('gym')) {
            const fitPrompts = ["Workout Challenge", "Healthy Eating Tip", "Member Spotlight" + businessParams];
            prompt = fitPrompts[Math.floor(Math.random() * fitPrompts.length)];
        } else if (ind.includes('retail') || ind.includes('shop')) {
            const shopPrompts = ["New Arrival Alert", "Limited Time Sale", "Staff Pick" + businessParams];
            prompt = shopPrompts[Math.floor(Math.random() * shopPrompts.length)];
        }
    }

    // Typewriter effect
    topicInput.value = "";
    topicInput.focus();

    for (let i = 0; i < prompt.length; i++) {
        topicInput.value += prompt[i];
        await new Promise(r => setTimeout(r, 20));
    }

    handleGenerate(prompt);
}

// --- Core Logic ---

async function handleGenerate(topic) {
    topic = topic.trim();
    if (!topic) return;

    // 1. Add User Message
    addMessage(topic, 'user');
    topicInput.value = '';

    // 2. Start Loading State
    const loadingId = addMessage(`Analyzing **${userProfile?.businessName || 'Brand'}** profile... 🧠`, 'ai');

    try {
        await new Promise(r => setTimeout(r, 800)); // Short thinking pause

        let result;

        // 3. GENERATE CONTENT
        if (userProfile?.geminiApiKey) {
            try {
                // Update loading message instead of adding new one
                updateMessage(loadingId, "Connecting to Gemini AI... 🚀", 'ai');

                // Validate Key Format Basic Check
                if (!userProfile.geminiApiKey.startsWith('AIza')) {
                    throw new Error("Invalid API Key format (must start with AIza)");
                }

                result = await AIService.generateContent(topic, userProfile);
            } catch (error) {
                console.error("Gemini Error:", error);
                const isRateLimit = error.message.includes('429');
                const msg = isRateLimit
                    ? "Server is busy (Rate Limit). Using simulation mode. 🚦"
                    : `AI Error: ${error.message}. Using simulation mode. 🛠️`;

                updateMessage(loadingId, msg, 'ai');
                await new Promise(r => setTimeout(r, 1500)); // Let user read error
                result = mockAI(topic);
            }
        } else {
            // Fallback to Mock if no key
            if (!window.hasShownKeyWarning) {
                addMessage("⚠️ Tip: Add your free Gemini API Key in Settings for smarter, infinite generation!", 'ai');
                window.hasShownKeyWarning = true;
            }
            result = mockAI(topic);
        }

        currentTopic = topic;
        currentHeadline = result.headline;

        // Change template
        let newTemplate = currentTemplate;
        while (newTemplate === currentTemplate) {
            newTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
        }
        currentTemplate = newTemplate;

        // 4. Success Output
        removeMessage(loadingId);
        addMessage(`Here is a personalized post for **${userProfile?.businessName || 'your brand'}** regarding "**${topic}**".\n\n${result.caption}\n\n${result.hashtags}`, 'ai');

        renderCanvas();

    } catch (fatalError) {
        console.error("Fatal Generation Error:", fatalError);
        removeMessage(loadingId);
        addMessage("❌ Something went wrong. Please try again.", 'ai');
    }
}

// --- GEMINI API INTEGRATION ---
// function using AIService now - removed duplicate code

function mockAI(topic) {
    // Smart mocking based on inputs
    const t = topic.toLowerCase();
    const brand = userProfile?.businessName || "us";

    // Simple robust keyword matching
    if (t.includes('sale') || t.includes('offer') || t.includes('deal')) {
        return {
            headline: "Flash Sale Alert! ⚡",
            caption: `Don't miss out on biggest deals of the season at ${brand}. Shop now and save!`,
            hashtags: "#Sale #Deals #LimitedTime"
        };
    } else if (t.includes('coffee') || t.includes('food') || t.includes('menu')) {
        return {
            headline: "Taste the Magic ☕",
            caption: `Fresh flavors waiting for you at ${brand}. Come visit us today!`,
            hashtags: "#Foodie #Yum #Fresh"
        };
    } else if (t.includes('launch') || t.includes('new') || t.includes('arrival')) {
        return {
            headline: "Just Arrived! ✨",
            caption: `Check out what's new at ${brand}. You're going to love this.`,
            hashtags: "#New #Launch #Exciting"
        };
    } else {
        // Generic Fallback
        return {
            headline: topic.length < 25 ? topic : "Lumina Magic",
            caption: `Engage your audience with this update from ${brand}.`,
            hashtags: `#${brand.replace(/\s/g, '')} #Update #Viral`
        };
    }
}

// --- Canvas Rendering ---
function renderCanvas() {
    if (!ctx) return;

    // Background
    if (currentTemplate.bg.startsWith('linear-gradient')) {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#ec4899');
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = currentTemplate.bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text Config
    ctx.fillStyle = currentTemplate.textColor;
    ctx.font = currentTemplate.font;
    ctx.textAlign = currentTemplate.textAlign;
    ctx.textBaseline = 'middle';

    // Headline
    const x = currentTemplate.textAlign === 'center' ? canvas.width / 2 :
        currentTemplate.textAlign === 'right' ? canvas.width - 100 : 100;
    const y = canvas.height / 2;

    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    wrapText(ctx, currentHeadline, x, y, 900, 70);
    ctx.shadowBlur = 0;

    // --- PERSONALIZATION LAYER ---

    if (logoImage) {
        // Draw Logo (Bottom Center)
        const logoWidth = 150;
        const scale = logoWidth / logoImage.width;
        const logoHeight = logoImage.height * scale;

        // Draw white circle background for logo contrast
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height - 80, 60, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();

        ctx.drawImage(logoImage, (canvas.width / 2) - (logoWidth / 2), canvas.height - 120, logoWidth, logoHeight);
    } else {
        // Fallback: Text Watermark
        ctx.font = '30px "Plus Jakarta Sans"';
        ctx.fillStyle = currentTemplate.accentColor;
        ctx.textAlign = 'center';
        const watermarkText = userProfile?.businessName ? `@${userProfile.businessName}` : '@lumina.ai';
        ctx.fillText(watermarkText, canvas.width / 2, canvas.height - 80);
    }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Draw lines centered vertically around y
    let startY = y - ((lines.length - 1) * lineHeight) / 2;

    for (let k = 0; k < lines.length; k++) {
        context.fillText(lines[k], x, startY + (k * lineHeight));
    }
}

// --- Remix Actions ---
function remixTemplate() {
    let nextIndex = (TEMPLATES.indexOf(currentTemplate) + 1) % TEMPLATES.length;
    currentTemplate = TEMPLATES[nextIndex];
    renderCanvas();
    addMessage("Switched style! 🎨", 'ai');
}

function remixColor() {
    const colors = ['#1e293b', '#0f172a', '#4c1d95', '#be185d', '#047857', '#000000'];
    currentTemplate.bg = colors[Math.floor(Math.random() * colors.length)];
    renderCanvas();
}

function remixText() {
    const prefixes = ["New: ", "Alert: ", "Hot: ", "Check this: "];
    const randomPre = prefixes[Math.floor(Math.random() * prefixes.length)];
    currentHeadline = randomPre + currentHeadline.replace(/^(New: |Alert: |Hot: |Check this: )/, "");
    renderCanvas();
}

// --- Chat Selection ---
function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${type}`;
    // Convert newlines to breaks for display
    div.innerHTML = text.replace(/\n/g, '<br>');
    div.id = 'msg-' + Date.now();
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return div.id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function updateMessage(id, newText, type) {
    const el = document.getElementById(id);
    if (el) {
        el.className = `chat-bubble ${type}`;
        el.innerHTML = newText.replace(/\n/g, '<br>');
    }
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = `lumina-magic-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}
