/**
 * Reservation System - Frontend
 * Loads slot availability via AJAX and handles lightbox interaction
 */
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.querySelector('.rs-lightbox-overlay');
    const lightbox = document.querySelector('.rs-lightbox');
    const timeSpan = document.querySelector('.rs-lightbox-time');
    const timeInput = document.querySelector('.rs-lightbox-time-input');
    const nameInput = document.querySelector('.rs-lightbox-form .rs-input');
    const closeBtn = document.querySelector('.rs-lightbox-close');
    const cancelBtn = document.querySelector('.rs-lightbox-cancel');
    const slotsBody = document.getElementById('rs-slots-body');
    const container = document.getElementById('rs-availability-container');

    // Exit if no container found
    if (!container || !slotsBody) return;

    let lastFocusedElement = null;

    /**
     * Open the lightbox with the selected time
     */
    function openLightbox(time) {
        if (!overlay || !lightbox) return;

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
        if (!overlay) return;

        overlay.style.display = 'none';
        if (nameInput) nameInput.value = '';

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to the button that opened the lightbox
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    /**
     * Attach click handlers to slot buttons (called after rendering)
     */
    function attachButtonHandlers() {
        slotsBody.querySelectorAll('.rs-open-lightbox').forEach(button => {
            button.addEventListener('click', function() {
                const time = this.dataset.time;
                openLightbox(time);
            });
        });
    }

    /**
     * Render slots into the table body
     */
    function renderSlots(slots) {
        if (slots.length === 0) {
            slotsBody.innerHTML = '<tr><td colspan="3" class="rs-no-slots">Všechny termíny jsou obsazeny</td></tr>';
            return;
        }

        let html = '';
        slots.forEach(slot => {
            html += '<tr>';
            html += '<td>' + escapeHtml(slot.time) + '</td>';
            html += '<td>' + escapeHtml(slot.label) + '</td>';
            html += '<td><button type="button" class="rs-reserve-button rs-open-lightbox" data-time="' + escapeHtml(slot.time) + '">Rezervovat</button></td>';
            html += '</tr>';
        });

        slotsBody.innerHTML = html;
        attachButtonHandlers();
    }

    /**
     * Render closed state
     */
    function renderClosed(notice) {
        if (notice) {
            container.innerHTML = '<p class="rs-error">' + escapeHtml(notice) + '</p>';
        } else {
            container.innerHTML = '';
        }
    }

    /**
     * Render error state
     */
    function renderError() {
        slotsBody.innerHTML = '<tr><td colspan="3" class="rs-error">Nepodařilo se načíst dostupné termíny. Zkuste obnovit stránku.</td></tr>';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Load slot availability via AJAX
     */
    function loadAvailability() {
        // Check if rsConfig is available (passed from PHP via wp_localize_script)
        if (typeof rsConfig === 'undefined') {
            renderError();
            return;
        }

        fetch(rsConfig.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'rs_get_availability',
                nonce: rsConfig.nonce
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderSlots(data.data.slots);
            } else {
                // Reservations closed
                renderClosed(data.data.notice || '');
            }
        })
        .catch(() => {
            renderError();
        });
    }

    // Setup lightbox event listeners
    if (overlay && lightbox) {
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
    }

    // Load availability data on page load
    loadAvailability();
});
