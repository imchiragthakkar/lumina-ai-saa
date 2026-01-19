document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    // Add mobile style for nav if not present (simplified for JS toggle)
    // We update the CSS via JS for the active state to keep the CSS file clean of complex state logic
    
    mobileBtn.addEventListener('click', () => {
        const isOpen = nav.style.display === 'flex';
        
        if (isOpen) {
            nav.style.display = 'none';
            nav.style.position = 'static';
            nav.style.flexDirection = 'row';
            nav.style.width = 'auto';
            nav.style.height = 'auto';
            nav.style.backgroundColor = 'transparent';
        } else {
            nav.style.display = 'flex';
            nav.style.position = 'absolute';
            nav.style.top = '80px';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.height = 'calc(100vh - 80px)';
            nav.style.flexDirection = 'column';
            nav.style.backgroundColor = 'rgba(15, 17, 21, 0.95)';
            nav.style.padding = '2rem';
            nav.style.backdropFilter = 'blur(10px)';
            nav.style.zIndex = '999';
            
            // Adjust links for mobile
            const links = nav.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.style.fontSize = '1.5rem';
                link.style.marginBottom = '1.5rem';
            });
        }
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                nav.style.display = 'none';
            }
        });
    });

    // Sticky Header Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(15, 17, 21, 0.9)';
            header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(15, 17, 21, 0.8)';
            header.style.boxShadow = 'none';
        }
    });

    // Scroll Animations (Fade Up)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .pricing-card, .section-title');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Mock AI Generation Demo
    const generateBtn = document.querySelector('a[href="#generative"]');
    const aiText = document.querySelector('.ai-generation');
    const skeletonLines = document.querySelectorAll('.skeleton-line');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Scroll to top if needed, or just focus on the demo
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Simulate generation
            aiText.innerHTML = '<span class="sparkle">✨</span> Generating caption...';
            
            // Reset state
            skeletonLines.forEach(line => line.style.width = '100%');
            
            setTimeout(() => {
                aiText.innerHTML = '<span class="sparkle">✨</span> Optimizing hashtags...';
            }, 1500);

            setTimeout(() => {
                aiText.innerHTML = '<span class="sparkle">✨</span> Content Generated!';
                // Flash effect
                document.querySelector('.app-mockup').style.borderColor = 'var(--primary)';
                setTimeout(() => {
                    document.querySelector('.app-mockup').style.borderColor = 'var(--border)';
                }, 500);
            }, 3000);
        });
    }
});
