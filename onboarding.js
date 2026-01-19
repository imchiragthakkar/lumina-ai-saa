document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    const totalSteps = 3;

    const form = document.getElementById('onboardingForm');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');
    const stepIndicator = document.getElementById('stepIndicator');

    const steps = {
        1: document.getElementById('step1'),
        2: document.getElementById('step2'),
        3: document.getElementById('step3')
    };

    // Initialize
    updateUI();

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
            } else {
                // Submit form
                finishOnboarding();
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });

    function updateUI() {
        // Toggle steps
        for (let i = 1; i <= totalSteps; i++) {
            if (i === currentStep) {
                steps[i].classList.add('active');
            } else {
                steps[i].classList.remove('active');
            }
        }

        // Update Progress
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
        stepIndicator.textContent = `Step ${currentStep} of ${totalSteps}`;

        // Buttons
        if (currentStep === 1) {
            prevBtn.style.visibility = 'hidden';
            nextBtn.textContent = 'Next step';
        } else {
            prevBtn.style.visibility = 'visible';
            if (currentStep === totalSteps) {
                nextBtn.textContent = 'Finish & Create';
            } else {
                nextBtn.textContent = 'Next step';
            }
        }
    }

    function validateStep(step) {
        const currentStepEl = steps[step];
        const inputs = currentStepEl.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.style.borderColor = '#ef4444';

                // Reset border on input
                input.addEventListener('input', () => {
                    input.style.borderColor = '#e2e8f0';
                }, { once: true });
            }
        });

        if (step === 2) {
            // Radio validation
            const checked = currentStepEl.querySelector('input[name="tone"]:checked');
            if (!checked) {
                isValid = false;
                // Shake effect or warning?
                alert("Please select a brand tone.");
            }
        }

        return isValid;
    }

    function finishOnboarding() {
        nextBtn.textContent = 'Creating account...';
        nextBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    // Color Inputs update
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
        });
    });

    // File Upload handling
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('logoUpload');
    const filePreview = document.getElementById('filePreview');
    const previewImg = document.getElementById('previewImg');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFile');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFile);

    function handleFile(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("File is too large. Max 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                fileName.textContent = file.name;
                dropZone.classList.add('hidden');
                dropZone.style.display = 'none';
                filePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    removeFileBtn.addEventListener('click', () => {
        fileInput.value = '';
        filePreview.classList.add('hidden');
        dropZone.style.display = 'block';
    });
});
