
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
        // Always try AI first (AIService will handle key fallback)
        try {
            // Update loading message
            updateMessage(loadingId, "Connecting to Gemini AI... 🚀", 'ai');

            // Optional: Check if we have *any* key before request to avoid 400s, 
            // but AIService checks this now.

            result = await AIService.generateContent(topic, userProfile);

        } catch (error) {
            console.error("Gemini Error:", error);

            // Safe error message extraction
            const errText = (error?.message || String(error)).toLowerCase();
            const isRateLimit = errText.includes('429');
            const isMissingKey = errText.includes('api key missing');

            let msg = `AI connection issue (${errText.substring(0, 30)}...). Using simulation mode. 🛠️`;

            if (isRateLimit) msg = "Server is busy (Rate Limit). Using simulation mode. 🚦";
            if (isMissingKey) {
                msg = "No API Key found. Using simulation mode. (Check Settings or Source)";
                if (!window.hasShownKeyWarning) {
                    addMessage("⚠️ Tip: Add your API Key in Settings or source code for infinite generation!", 'ai');
                    window.hasShownKeyWarning = true;
                }
            }

            updateMessage(loadingId, msg, 'ai');

            // Wait briefly then force fallback
            await new Promise(r => setTimeout(r, 1500));
            result = mockAI(topic);
        }

        // --- DEFENSIVE CHECK: Ensure result is never undefined ---
        if (!result) {
            console.warn("Unexpected: result is undefined after generation logic. Using final fallback.");
            result = mockAI(topic);
        }

        // Normalize Keys (Handle Case Sensitivity/Empty from AI)
        const h = result.headline || result.Headline || "";
        const c = result.caption || result.Caption || "";
        const ht = result.hashtags || result.Hashtags || "";

        // Enforce valid string
        result.headline = (h.trim().length > 0) ? h : `Update about ${topic}`;
        result.caption = c;
        result.hashtags = ht;

        currentTopic = topic;
        currentHeadline = result.headline;

        // 4. Success Output
        removeMessage(loadingId);
        addMessage(`Here is a personalized post for **${userProfile?.businessName || 'your brand'}** regarding "**${topic}**".\n\n${result.caption}\n\n${result.hashtags}`, 'ai');

        // --- 5. APPLY AI DESIGN ---
        if (result.design) {
            console.log("Applying AI Design:", result.design);

            // Map AI Font Mood to actual fonts
            let fontStack = '"Plus Jakarta Sans", sans-serif';
            let fontWeight = 'bold';
            let fontSize = '48px';

            switch (result.design.font_mood) {
                case 'classic': fontStack = '"Playfair Display", serif'; fontWeight = 'bold'; break;
                case 'handwritten': fontStack = '"Caveat", cursive'; fontWeight = 'normal'; fontSize = '55px'; break;
                case 'modern': fontStack = '"Plus Jakarta Sans", sans-serif'; fontWeight = '600'; break;
                case 'bold': fontStack = '"Oswald", sans-serif'; fontWeight = '700'; fontSize = '55px'; break;
            }

            currentTemplate = {
                id: 'ai_custom',
                bg: result.design.background_color,
                bgImagePrompt: result.design.image_prompt, // Store URL logic later
                overlayOpacity: result.design.overlay_opacity || 0.4,
                textColor: result.design.text_color,
                accentColor: result.design.accent_color,
                font: `${fontWeight} ${fontSize} ${fontStack}`,
                textAlign: result.design.layout === 'hero' ? 'left' : (result.design.layout === 'bold' ? 'right' : 'center'),
                layout: result.design.layout
            };

            // --- 6. FETCH BACKGROUND IMAGE ---
            if (result.design.image_prompt) {
                updateMessage(loadingId, "Generating AI Visuals... 🎨", 'ai');
                const safePrompt = encodeURIComponent(result.design.image_prompt);
                const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

                console.log("Fetching Image:", imageUrl);

                // Preload Image
                const bgImg = new Image();
                bgImg.crossOrigin = "Anonymous";
                bgImg.src = imageUrl;

                bgImg.onload = () => {
                    currentTemplate.bgImageObj = bgImg; // Store loaded image
                    renderCanvas();
                    addMessage("✨ Enhanced the post with a custom AI-generated background!", 'ai');
                };

                bgImg.onerror = () => {
                    console.warn("Image gen failed, falling back to colors");
                    renderCanvas(); // Render without image
                };
            }
        } else {
            // Fallback to random if no design provided
            let newTemplate = currentTemplate;
            while (newTemplate === currentTemplate) {
                newTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
            }
            currentTemplate = newTemplate;
        }

        renderCanvas();

    } catch (fatalError) {
        console.error("Fatal Generation Error:", fatalError);
        removeMessage(loadingId);
        addMessage(`❌ Something went wrong: ${(fatalError?.message || String(fatalError))}`, 'ai');
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
            hashtags: "#Sale #Deals #LimitedTime",
            design: {
                background_color: "#be185d",
                text_color: "#ffffff",
                accent_color: "#fbbf24",
                font_mood: "bold",
                layout: "bold",
                image_prompt: "High energy promotional banner background with lightning bolts and bright colors, detailed, 4k"
            }
        };
    } else if (t.includes('coffee') || t.includes('food') || t.includes('menu')) {
        return {
            headline: "Taste the Magic ☕",
            caption: `Fresh flavors waiting for you at ${brand}. Come visit us today!`,
            hashtags: "#Foodie #Yum #Fresh",
            design: {
                background_color: "#3f2c2c",
                text_color: "#ffffff",
                accent_color: "#d4a373",
                font_mood: "handwritten",
                layout: "center",
                image_prompt: "Cozy coffee shop interior with latte art and warm lighting, detailed, photorealistic"
            }
        };
    } else if (t.includes('launch') || t.includes('new') || t.includes('arrival')) {
        return {
            headline: "Just Arrived! ✨",
            caption: `Check out what's new at ${brand}. You're going to love this.`,
            hashtags: "#New #Launch #Exciting",
            design: {
                background_color: "#1e1e2f",
                text_color: "#ffffff",
                accent_color: "#00d4ff",
                font_mood: "modern",
                layout: "hero",
                image_prompt: "Futuristic product launch podium with glowing lights and sleek design, 3d render"
            }
        };
    } else {
        // Generic Fallback
        const genericHeadlines = ["Exciting News! ✨", "Fresh Update 🚀", "Did You Know? 💡", "Special Announcement 📢", "Trending Now 🔥"];

        // Command word filter (prevent "create post for..." appearing as headline)
        const commandWords = ['create', 'make', 'generate', 'post', 'for', 'instagram', 'write', 'about'];
        const isCommand = commandWords.some(w => t.startsWith(w));

        // Keyword Extraction (e.g., "Diwali" from "create diwali post")
        let displayHeadline = "";

        if (t.includes('diwali') || t.includes('festival') || t.includes('christmas') || t.includes('holiday')) {
            displayHeadline = "Happy Holidays! ✨";
            if (t.includes('diwali')) displayHeadline = "Happy Diwali! 🪔";
            if (t.includes('christmas')) displayHeadline = "Merry Christmas! 🎄";
        } else if (!isCommand && t.length < 40) {
            displayHeadline = topic;
        } else {
            displayHeadline = genericHeadlines[Math.floor(Math.random() * genericHeadlines.length)];
        }

        return {
            headline: displayHeadline,
            caption: `Here is a special update regarding ${topic} from ${brand}. We have some exciting things to share with you!`,
            hashtags: `#${brand.replace(/\s/g, '')} #Trend #Viral`,
            design: {
                background_color: "linear-gradient(135deg, #1e293b, #0f172a)",
                text_color: "#e2e8f0",
                accent_color: "#38bdf8",
                font_mood: "modern",
                layout: "center",
                image_prompt: `A creative abstract background representing ${topic}, professional, high quality, 4k`
            }
        };
    }
}

// --- Canvas Rendering ---
function renderCanvas() {
    if (!ctx) return;

    // 1. Draw Background (Image or Fallback)
    if (currentTemplate.bgImageObj) {
        try {
            const img = currentTemplate.bgImageObj;
            const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;

            // Apply slight tint/filter if requested (simulated via fillStyle later)
            ctx.drawImage(img, 0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        } catch (e) {
            ctx.fillStyle = currentTemplate.bg || '#1e293b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {
        // Gradient fallback
        if (currentTemplate.bg && currentTemplate.bg.startsWith('linear-gradient')) {
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, '#4f46e5');
            grad.addColorStop(1, '#9333ea');
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = currentTemplate.bg || '#1e293b';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Smart Overlay (Unification Layer)
    const overlayStyle = currentTemplate.overlay_style || 'gradient-bottom';

    if (overlayStyle === 'gradient-bottom') {
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.8, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (overlayStyle === 'vignette') {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (overlayStyle === 'solid-dim') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Layout Configuration
    const composition = currentTemplate.composition || 'centered';
    let textX = canvas.width / 2;
    let textY = canvas.height / 2;
    let align = 'center';
    let maxTextWidth = 900;

    if (composition === 'hero-bottom') {
        textY = canvas.height * 0.75;
        align = 'center';
    } else if (composition === 'minimal-top') {
        textY = canvas.height * 0.3;
        align = 'center';
    } else if (composition === 'magazine-layout') {
        textX = 100;
        textY = canvas.height * 0.7;
        align = 'left';
        maxTextWidth = 800;
    }

    // 4. Draw Branding (Logo) - Smart Integration
    if (logoImage) {
        const logoWidth = 140;
        const scale = logoWidth / logoImage.width;
        const logoHeight = logoImage.height * scale;

        let logoX = (canvas.width / 2) - (logoWidth / 2);
        let logoY = 80;

        if (composition === 'hero-bottom') logoY = 80;
        else if (composition === 'minimal-top') logoY = canvas.height - 180;
        else if (composition === 'magazine-layout') { logoX = canvas.width - logoWidth - 80; logoY = 80; }

        ctx.save();
        // Native Blending: Logo looks "printed" on the background
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 10;
        ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
        ctx.restore();
    } else {
        // Text Watermark
        ctx.save();
        ctx.font = 'bold 28px "Plus Jakarta Sans"';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 5;
        const brandName = userProfile?.businessName ? `@${userProfile.businessName}` : '@lumina.ai';
        ctx.fillText(brandName, canvas.width / 2, canvas.height - 50);
        ctx.restore();
    }

    // 5. Draw Typography
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = currentTemplate.textColor || '#ffffff';

    // Headline
    ctx.font = currentTemplate.font || 'bold 50px "Plus Jakarta Sans"';

    // Smooth readable shadow check
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 20;
    wrapText(ctx, currentHeadline, textX, textY, maxTextWidth, 70);
    ctx.shadowBlur = 0;

    // 6. Global Unification (The "Nano" Finish)
    // Add subtle grain to bake everything together
    addNoise(ctx);
}

// Helper: Add cinematic grain
function addNoise(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const iData = ctx.getImageData(0, 0, w, h);
    const buffer = iData.data;
    const amount = 20; // Subtle grain

    for (let i = 0; i < buffer.length; i += 4) {
        const noise = (Math.random() - 0.5) * amount;
        buffer[i] = Math.min(255, Math.max(0, buffer[i] + noise));
        buffer[i + 1] = Math.min(255, Math.max(0, buffer[i + 1] + noise));
        buffer[i + 2] = Math.min(255, Math.max(0, buffer[i + 2] + noise));
    }
    ctx.putImageData(iData, 0, 0);
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
