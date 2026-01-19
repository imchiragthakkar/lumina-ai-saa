document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generateForm');
    const emptyState = document.querySelector('.empty-state');
    const loadingState = document.getElementById('loadingState');
    const resultState = document.getElementById('resultState');
    const outputActions = document.getElementById('outputActions');

    // Output Elements
    const captionArea = document.getElementById('captionText');
    const hashContainer = document.getElementById('hashtagContainer');
    const ctaResult = document.getElementById('ctaResult');

    // Tone Selection
    const toneBtns = document.querySelectorAll('.tone-btn');
    toneBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toneBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Show Loading
        emptyState.style.display = 'none';
        resultState.classList.add('hidden');
        loadingState.classList.remove('hidden');
        outputActions.style.display = 'none';

        const topic = document.getElementById('topic').value;
        const keywords = document.getElementById('keywords').value;

        // 2. Simulate Delay (1.5s)
        setTimeout(() => {
            loadingState.classList.add('hidden');
            resultState.classList.remove('hidden');
            outputActions.style.display = 'flex';

            // 3. Generate Mock Content
            generateContent(topic, keywords);

        }, 1500);
    });

    function generateContent(topic, keywords) {
        // Clear previous
        captionArea.textContent = '';
        hashContainer.innerHTML = '';

        // Mock data
        const mockCaptions = [
            `Ready to elevate your game? 🚀 \n\nWe're thrilled to introduce something special: ${topic}. It's not just a product, it's a lifestyle upgrade. ✨\n\nExperience the difference today.`,
            `Big news! 📣 \n\nSay hello to ${topic}! We've poured our hearts into this one. \n\nGet yours now before they're gone!`,
            `Summer vibes are here! ☀️ \n\nRefresh your routine with ${topic}. Perfect for the season and guaranteed to make you smile. 😊`
        ];

        const selectedCaption = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];

        // Typing Effect
        let i = 0;
        const typeInterval = setInterval(() => {
            captionArea.textContent += selectedCaption.charAt(i);
            i++;
            if (i > selectedCaption.length) {
                clearInterval(typeInterval);
            }
        }, 20); // Fast typing

        // Hashtags
        const baseTags = ['#LuminaAI', '#Growth', '#NewLaunch'];
        const dynamicTags = keywords.split(',').map(k => '#' + k.trim().replace(/\s+/g, '')).filter(k => k.length > 1);
        const allTags = [...baseTags, ...dynamicTags];

        allTags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'hashtag-chip';
            span.textContent = tag;
            hashContainer.appendChild(span);
        });

        // CTA
        ctaResult.textContent = "Click the link in bio to shop now! 🛍️";
    }

    // Copy Functionality
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => {
        const text = captionArea.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        });
    });

    // Regenerate
    document.getElementById('regenerateBtn').addEventListener('click', () => {
        form.dispatchEvent(new Event('submit'));
    });
});
