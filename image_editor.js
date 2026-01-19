window.addEventListener('load', () => {
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');

    // State
    const state = {
        template: 'minimal',
        text: 'Summer Sale is Live! 50% Off.',
        color: '#4f46e5',
        showLogo: true,
        logoText: 'LuminaAI'
    };

    // Elements
    const textInput = document.getElementById('mainText');
    const colorSwatches = document.querySelectorAll('.swatch');
    const logoToggle = document.getElementById('showLogo');
    const templates = document.querySelectorAll('.template-thumb');
    const downloadBtn = document.getElementById('downloadBtn');

    // Init Render
    render();

    // Event Listeners
    textInput.addEventListener('input', (e) => {
        state.text = e.target.value;
        render();
    });

    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            colorSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            state.color = swatch.dataset.color;
            render();
        });
    });

    logoToggle.addEventListener('change', (e) => {
        state.showLogo = e.target.checked;
        render();
    });

    templates.forEach(tmpl => {
        tmpl.addEventListener('click', () => {
            templates.forEach(t => t.classList.remove('active'));
            tmpl.classList.add('active');
            state.template = tmpl.dataset.template;
            render();
        });
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'lumina-design.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // Main Render Function
    function render() {
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = getBackgroundStyle();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Template Specific Graphics
        if (state.template === 'bold') {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(canvas.width, 0, 600, 0, Math.PI * 2);
            ctx.fill();
        } else if (state.template === 'quote') {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200);

            // Big Quote Icon
            ctx.font = '200px serif';
            ctx.fillStyle = state.color;
            ctx.globalAlpha = 0.2;
            ctx.fillText('"', 150, 300);
            ctx.globalAlpha = 1;
        }

        // Text
        drawText();

        // Logo
        if (state.showLogo) {
            drawLogo();
        }
    }

    function getBackgroundStyle() {
        switch (state.template) {
            case 'minimal': return '#ffffff';
            case 'bold': return state.color; // Brand color bg
            case 'image-focus': return '#1f2937'; // Dark theme
            case 'quote': return state.color; // Brand color bg with overlay in render
            default: return '#ffffff';
        }
    }

    function getTextColor() {
        if (state.template === 'bold' || state.template === 'image-focus') return '#ffffff';
        return '#111827';
    }

    function drawText() {
        ctx.fillStyle = getTextColor();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let fontSize = 80;
        let x = canvas.width / 2;
        let y = canvas.height / 2;

        if (state.template === 'minimal') {
            // Left aligned big text
            ctx.textAlign = 'left';
            x = 100;
            ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        } else if (state.template === 'quote') {
            fontSize = 60;
            ctx.font = `italic ${fontSize}px "Plus Jakarta Sans", serif`;
            ctx.fillStyle = '#111827'; // Always dark on white card
        } else {
            ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        }

        wrapText(ctx, state.text, x, y, canvas.width - 200, fontSize * 1.2);
    }

    function drawLogo() {
        ctx.fillStyle = getTextColor();
        ctx.font = 'bold 40px "Plus Jakarta Sans", sans-serif';
        const logoX = 60;
        const logoY = canvas.height - 60;

        ctx.textAlign = 'left';

        // Simple shape logo
        ctx.beginPath();
        ctx.arc(logoX + 15, logoY - 15, 15, 0, Math.PI * 2);

        if (state.template === 'minimal') {
            ctx.fillStyle = state.color;
        }

        ctx.fill();

        // Text
        ctx.fillStyle = getTextColor();
        if (state.template === 'quote') ctx.fillStyle = '#111827';

        ctx.fillText(state.logoText, logoX + 45, logoY);
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lines = [];

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Adjust Y to center the block of text if center aligned
        if (ctx.textAlign === 'center') {
            y -= (lines.length - 1) * lineHeight / 2;
        }

        for (let k = 0; k < lines.length; k++) {
            ctx.fillText(lines[k], x, y + (k * lineHeight));
        }
    }
});
