
/**
 * AI Service for Lumina
 * Handles interactions with Google Gemini API
 */

export const AIService = {
    /**
     * Generate content using Google Gemini
     * @param {string} topic - The user's input topic
     * @param {object} profile - User profile containing business details and API key
     * @returns {Promise<object>} - JSON object with headline, caption, hashtags
     */
    async generateContent(topic, profile) {
        if (!profile.geminiApiKey) {
            throw new Error("API Key missing");
        }

        const apiKey = profile.geminiApiKey;
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
                "hashtags": "5-7 relevant hashtags mixed (niche + broad)"
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
                    console.warn(`API Rate Limit (429) or Service Unavailable (503). Retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2; // Exponential backoff
                    continue;
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
                if (i === MAX_RETRIES - 1) throw err; // Throw on last fail

                // Retry logic
                const isRetryable = err.message.includes('429') || err.message.includes('503') || err.name === 'TypeError';
                if (isRetryable) {
                    // already waited or will wait
                } else {
                    throw err;
                }
            }
        }
    }
};
