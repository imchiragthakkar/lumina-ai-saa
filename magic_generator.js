import { db, auth } from "./firebase-config.js";

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

// --- DOM Elements ---
const chatContainer = document.getElementById('chatContainer');
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const autoMagicBtn = document.getElementById('autoMagicBtn');
const canvas = document.getElementById('magicCanvas');
const ctx = canvas.getContext('2d');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure fonts are loaded before first render
    document.fonts.ready.then(() => {
        console.log("Fonts loaded, rendering initial canvas...");
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
    const prompts = [
        "Summer Sale Announcement",
        "Monday Morning Motivation",
        "New Product Launch Teaser",
        "Customer Appreciation Post",
        "Healthy Lifestyle Tip",
        "Grand Opening Event",
        "Behind the Scenes Look"
    ];

    const randomTopic = prompts[Math.floor(Math.random() * prompts.length)];

    // Typewriter effect for input
    topicInput.value = "";
    topicInput.focus();

    for (let i = 0; i < randomTopic.length; i++) {
        topicInput.value += randomTopic[i];
        await new Promise(r => setTimeout(r, 30)); // Typing speed
    }

    // Trigger generation
    handleGenerate(randomTopic);
}

// --- Core Logic ---

async function handleGenerate(topic) {
    topic = topic.trim();
    if (!topic) return;

    // 1. Add User Message
    addMessage(topic, 'user');
    topicInput.value = '';

    // 2. Show Loading
    const loadingId = addMessage('Thinking...', 'ai');

    // 3. Simulate AI Delay
    await new Promise(r => setTimeout(r, 1200));

    // 4. "AI" Generates Content (Mock)
    const result = mockAI(topic);
    currentTopic = topic;
    currentHeadline = result.headline;
    // Pick random template that ISN'T the current one
    let newTemplate = currentTemplate;
    while (newTemplate === currentTemplate) {
        newTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    }
    currentTemplate = newTemplate;

    // 5. Update UI
    removeMessage(loadingId);
    addMessage(`Here you go! I created a design for "**${topic}**".\n\n${result.caption}\n\n${result.hashtags}`, 'ai');

    // 6. Update Canvas
    renderCanvas();
}

function mockAI(topic) {
    const t = topic.toLowerCase();

    if (t.includes('sale') || t.includes('offer')) {
        return {
            headline: "Flash Sale Alert! ⚡",
            caption: "Don't miss out on our biggest deals of the season. Shop now and save big.",
            hashtags: "#Sale #Deals #LimitedTime"
        };
    } else if (t.includes('coffee') || t.includes('food')) {
        return {
            headline: "Taste the Magic ☕",
            caption: "Start your day right with our premium blends. Freshly brewed just for you.",
            hashtags: "#CoffeeLover #MorningVibes #Fresh"
        };
    } else if (t.includes('motivation') || t.includes('monday')) {
        return {
            headline: "Dream Big. Start Now.",
            caption: "The future belongs to those who believe in the beauty of their dreams.",
            hashtags: "#MondayMotivation #Inspiration #Goals"
        };
    } else if (t.includes('launch') || t.includes('new')) {
        return {
            headline: "Something New is Here!",
            caption: "We've been working on this for months. Can't wait for you to see it.",
            hashtags: "#NewArrival #Launch #Exciting"
        };
    } else {
        return {
            headline: topic.length < 20 ? topic : "Lumina AI Magic",
            caption: `Here is some amazing content about ${topic}. Engage your audience with this insight!`,
            hashtags: `#${topic.replace(/\s/g, '')} #LuminaAI #Viral`
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

    // Draw Headline (Simple wrap)
    const x = currentTemplate.textAlign === 'center' ? canvas.width / 2 :
        currentTemplate.textAlign === 'right' ? canvas.width - 100 : 100;

    const y = canvas.height / 2;

    // Add Shadow for readability
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;

    wrapText(ctx, currentHeadline, x, y, 900, 70);

    // Reset Shadow
    ctx.shadowBlur = 0;

    // Draw "Watermark" or Brand Name
    ctx.font = '30px "Plus Jakarta Sans"';
    ctx.fillStyle = currentTemplate.accentColor;
    ctx.textAlign = 'center';
    ctx.fillText('@lumina.ai', canvas.width / 2, canvas.height - 80);
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

function downloadImage() {
    const link = document.createElement('a');
    link.download = `lumina-magic-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}
