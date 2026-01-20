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
const canvas = document.getElementById('magicCanvas');
const ctx = canvas.getContext('2d');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderCanvas(); // Initial render

    // Event Listeners
    generateBtn.addEventListener('click', handleGenerate);
    topicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGenerate();
    });

    document.getElementById('remixTemplate').addEventListener('click', remixTemplate);
    document.getElementById('remixColor').addEventListener('click', remixColor);
    document.getElementById('remixText').addEventListener('click', remixText);
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
});

// --- Core Logic ---

async function handleGenerate() {
    const topic = topicInput.value.trim();
    if (!topic) return;

    // 1. Add User Message
    addMessage(topic, 'user');
    topicInput.value = '';

    // 2. Show Loading
    const loadingId = addMessage('Thinking...', 'ai');

    // 3. Simulate AI Delay
    await new Promise(r => setTimeout(r, 1500));

    // 4. "AI" Generates Content (Mock)
    const result = mockAI(topic);
    currentTopic = topic;
    currentHeadline = result.headline;
    currentTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]; // Pick random template

    // 5. Update UI
    removeMessage(loadingId);
    addMessage(`Here is a post for "${topic}":\n\n**${result.headline}**\n\n${result.caption}\n\n${result.hashtags}`, 'ai');

    // 6. Update Canvas
    renderCanvas();
}

function mockAI(topic) {
    // Simple rule-based "AI" for MVP
    const keywords = topic.toLowerCase().split(' ');

    if (keywords.includes('sale') || keywords.includes('offer')) {
        return {
            headline: "Flash Sale Alert! ⚡",
            caption: "Don't miss out on our biggest deals of the season. Shop now and save big.",
            hashtags: "#Sale #Deals #LimitedTime"
        };
    } else if (keywords.includes('coffee') || keywords.includes('food')) {
        return {
            headline: "Taste the Magic ☕",
            caption: "Start your day right with our premium blends. Freshly brewed just for you.",
            hashtags: "#CoffeeLover #MorningVibes #Fresh"
        };
    } else if (keywords.includes('gym') || keywords.includes('fitness')) {
        return {
            headline: "Crush Your Goals 💪",
            caption: "The only bad workout is the one that didn't happen. Let's get moving!",
            hashtags: "#Fitness #Motivation #GymLife"
        };
    } else {
        return {
            headline: topic.charAt(0).toUpperCase() + topic.slice(1),
            caption: `Here is some amazing content about ${topic}. Engage your audience with this insight!`,
            hashtags: `#${topic.replace(/\s/g, '')} #LuminaAI #Viral`
        };
    }
}

// --- Canvas Rendering ---
function renderCanvas() {
    // Background
    if (currentTemplate.bg.startsWith('linear-gradient')) {
        // Simple gradient approximation
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
    const x = currentTemplate.textAlign === 'center' ? canvas.width / 2 : 100;
    const y = canvas.height / 2;
    wrapText(ctx, currentHeadline, x, y, 900, 60);

    // Draw "Watermark" or Brand Name
    ctx.font = '24px "Plus Jakarta Sans"';
    ctx.fillStyle = currentTemplate.accentColor;
    ctx.textAlign = 'center';
    ctx.fillText('@lumina.ai', canvas.width / 2, canvas.height - 50);
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
    // Randomize BG color for current template (simple override)
    const colors = ['#1e293b', '#0f172a', '#4c1d95', '#be185d', '#047857'];
    currentTemplate.bg = colors[Math.floor(Math.random() * colors.length)];
    renderCanvas();
}

function remixText() {
    currentHeadline = "Re-imagined: " + currentHeadline;
    renderCanvas();
}

// --- Chat Selection ---
function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${type}`;
    div.innerText = text;
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
