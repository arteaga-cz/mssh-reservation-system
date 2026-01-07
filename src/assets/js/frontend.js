/**
 * Reservation System - Frontend Lightbox
 */
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.querySelector('.rs-lightbox-overlay');
    const lightbox = document.querySelector('.rs-lightbox');
    const timeSpan = document.querySelector('.rs-lightbox-time');
    const timeInput = document.querySelector('.rs-lightbox-time-input');
    const nameInput = document.querySelector('.rs-lightbox-form .rs-input');
    const closeBtn = document.querySelector('.rs-lightbox-close');
    const cancelBtn = document.querySelector('.rs-lightbox-cancel');

    // Exit if no lightbox elements found
    if (!overlay || !lightbox) return;

    let lastFocusedElement = null;

    /**
     * Open the lightbox with the selected time
     */
    function openLightbox(time) {
        lastFocusedElement = document.activeElement;
        timeSpan.textContent = time;
        timeInput.value = time;
        overlay.style.display = 'flex';

        // Focus on the name input after a brief delay for animation
        setTimeout(() => {
            nameInput?.focus();
        }, 50);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the lightbox
     */
    function closeLightbox() {
        overlay.style.display = 'none';
        if (nameInput) nameInput.value = '';

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to the button that opened the lightbox
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    // Open lightbox on button click
    document.querySelectorAll('.rs-open-lightbox').forEach(button => {
        button.addEventListener('click', function() {
            const time = this.dataset.time;
            openLightbox(time);
        });
    });

    // Close on close button click
    closeBtn?.addEventListener('click', closeLightbox);

    // Close on cancel button click
    cancelBtn?.addEventListener('click', closeLightbox);

    // Close on overlay click (not lightbox itself)
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.style.display === 'flex') {
            closeLightbox();
        }
    });

    // Simple focus trap within lightbox
    lightbox.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;

        const focusableElements = lightbox.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
});
