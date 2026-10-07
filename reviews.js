document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('reviewsViewport');
    const track = document.getElementById('reviewsTrack');
    const firstCard = track?.querySelector('.review-card');
    if (!viewport || !track || !firstCard) return;

    function moveByCard(direction) {
        const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
        const distance = firstCard.getBoundingClientRect().width + gap;
        viewport.scrollLeft += direction * distance;
    }

    document.getElementById('reviewsPrev')?.addEventListener('click', () => moveByCard(-1));
    document.getElementById('reviewsNext')?.addEventListener('click', () => moveByCard(1));
});
