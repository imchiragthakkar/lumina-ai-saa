
/**
 * AI Service for Lumina
 * Handles interactions with Google Gemini API
 */

const SYSTEM_API_KEY = "AIzaSyBC1-DScgqwqtBF5P2I4hobuLtuR1lzV2k"; // ⚠️ REPLACE THIS with your actual request-level API Key if not using User Settings

export const AIService = {
    /**
     * Generate content using Google Gemini
     * @param {string} topic - The user's input topic
     * @param {object} profile - User profile containing business details and API key
     * @returns {Promise<object>} - JSON object with headline, caption, hashtags
     */
    async generateContent(topic, profile) {
        const apiKey = profile.geminiApiKey || SYSTEM_API_KEY;

        if (!apiKey) {
            throw new Error("API Key missing. Please add it in Settings or configure SYSTEM_API_KEY in ai-service.js");
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const brandContext = `
            Business Name: ${profile.businessName || "Generic Brand"}
            Industry: ${profile.industry || "General"}
            Business Description: ${profile.description || "No description provided"}
            Tone: ${profile.tone || "Professional"}
        `;

        const instructions = `
            Act as a senior social media manager for the business described above.
            
            TASK: Create an engaging Instagram post about: "${topic}".
            
            STRATEGY:
            1. Analyze the Business Description to understand the brand's unique value.
            2. Connect the topic ("${topic}") to the brand's products/services.
            3. Use the specified Tone.
            
            OUTPUT format (Raw JSON only):
            {
                "headline": "Creative, short text for the image design (max 6 words)",
                "caption": "Engaging caption incorporating the business context and topic. Use emojis.",
                "hashtags": "5-7 relevant hashtags mixed (niche + broad)",
                "design": {
                    "image_prompt": "A detailed, photorealistic English description of a background image. CRITICAL: It MUST visually combine the Industry (e.g., specific products/setting), the Brand Tone, and the Topic. Do not use text.",
                    "composition": "One of: 'centered', 'hero-bottom', 'minimal-top', 'magazine-layout'",
                    "overlay_style": "One of: 'gradient-bottom', 'vignette', 'solid-dim', 'glass'",
                    "image_filter": "One of: 'none', 'sepia', 'warm', 'cool', 'muted'",
                    "visual_style": "One of: 'minimal', 'bold', 'luxury', 'playful', 'nature', 'tech'",
                    "background_color": "Fallback Hex code",
                    "text_color": "Hex code (usually #ffffff if using image background)",
                    "accent_color": "Hex code for emphasis",
                    "font_mood": "One of: 'modern', 'classic', 'handwritten', 'bold'",
                    "layout": "One of: 'center', 'hero', 'clean', 'bold'"
                }
            }
        `;

        const MAX_RETRIES = 3;
        let delay = 1000;

        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: instructions }] }]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.status === 429 || response.status === 503) {
                    const jitter = Math.random() * 1000;
                    const waitTime = delay + jitter;
                    console.warn(`API Rate Limit (${response.status}). Retrying in ${Math.floor(waitTime)}ms...`);

                    await new Promise(r => setTimeout(r, waitTime));
                    delay *= 2; // Exponential backoff
                    continue; // Correctly retry
                }

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();

                if (!data.candidates || !data.candidates[0].content) {
                    throw new Error("Invalid API Response");
                }

                const text = data.candidates[0].content.parts[0].text;
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonStr);

            } catch (err) {
                if (err.name === 'AbortError') {
                    throw new Error("Connection timed out (15s).");
                }

                // Don't retry if it's the last attempt
                if (i === MAX_RETRIES - 1) throw err;

                // Check for retryable errors (Network/RateLimit)
                const isRetryable = err.message.includes('429') || err.message.includes('503') || err.name === 'TypeError';

                if (isRetryable) {
                    const jitter = Math.random() * 1000;
                    const waitTime = delay + jitter;
                    console.warn(`Attempt ${i + 1} failed: ${err.message}. Retrying in ${Math.floor(waitTime)}ms...`);

                    await new Promise(r => setTimeout(r, waitTime));
                    delay *= 2;
                } else {
                    console.error("Non-retryable API Error:", err);
                    throw err;
                }
            }
        }
    }
};
