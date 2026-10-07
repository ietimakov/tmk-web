/* A short flight between the fixed Earth and Moon decorations. */
document.addEventListener('DOMContentLoaded', () => {
    const rocket = document.getElementById('spaceRocket');
    const earth = document.querySelector('.space-planet--earth');
    const moon = document.querySelector('.space-planet--moon');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!rocket || !earth || !moon || !rocket.animate) return;

    const DURATION = 8000;
    let flight = null;
    let nextFlight = null;
    let resizeTimer = null;
    let rocketEnabled = false;
    let flightStarted = false;

    const isMobile = () => window.matchMedia('(max-width: 600px)').matches;

    const between = (a, b, share) => a + (b - a) * share;

    function clearFlight() {
        window.clearTimeout(nextFlight);
        window.clearTimeout(resizeTimer);
        if (flight) flight.cancel();
        flight = null;
        rocket.classList.remove('is-flying');
        rocket.style.visibility = 'hidden';
    }

    function scheduleFlight(delay) {
        window.clearTimeout(nextFlight);
        if (!document.hidden && !reducedMotion.matches && !isMobile() && rocketEnabled && !flightStarted) {
            nextFlight = window.setTimeout(runFlight, delay);
        }
    }

    function runFlight() {
        if (document.hidden || reducedMotion.matches || isMobile() || !rocketEnabled || flightStarted) return;

        flightStarted = true;

        const earthRect = earth.getBoundingClientRect();
        const moonRect = moon.getBoundingClientRect();
        const from = {
            x: Math.min(window.innerWidth - 22, earthRect.left + earthRect.width * 0.25),
            y: earthRect.top + earthRect.height * 0.7
        };
        const center = { x: window.innerWidth * 0.52, y: window.innerHeight * 0.5 };
        const to = {
            x: Math.max(18, moonRect.left + moonRect.width * 0.78),
            y: moonRect.top + moonRect.height * 0.36
        };
        const halfWidth = rocket.offsetWidth / 2;
        const halfHeight = rocket.offsetHeight / 2;
        const fullSize = 1.08;

        function frame(offset, x, y, scale, degrees, opacity, easing) {
            return {
                offset,
                transform: `translate3d(${x - halfWidth}px, ${y - halfHeight}px, 0) rotate(${degrees}deg) scale(${scale})`,
                opacity,
                ...(easing ? { easing } : {})
            };
        }

        const frames = [
            frame(0, from.x, from.y, 0.025, -18, 0),
            frame(0.045, from.x - 8, from.y + 5, 0.065, -18, 1, 'ease-out'),
            frame(0.18, between(from.x, center.x, 0.3), between(from.y, center.y, 0.3) - 30, 0.28, -18, 1),
            frame(0.38, between(from.x, center.x, 0.82), between(from.y, center.y, 0.82) - 18, 0.78, -18, 1, 'ease-out'),
            frame(0.47, center.x, center.y, fullSize, -18, 1),
            frame(0.52, center.x + 4, center.y - 3, fullSize, 72, 1),
            frame(0.57, center.x + 7, center.y - 6, fullSize, 162, 1),
            frame(0.62, center.x + 4, center.y - 3, fullSize, 252, 1),
            frame(0.67, center.x, center.y, fullSize, 342, 1),
            frame(0.72, center.x, center.y, fullSize, 342, 1, 'ease-in'),
            frame(0.82, between(center.x, to.x, 0.3), between(center.y, to.y, 0.3) - 15, 0.88, 337, 1),
            frame(0.94, between(center.x, to.x, 0.82), between(center.y, to.y, 0.82), 0.31, 337, 1),
            frame(1, to.x, to.y, 0.035, 337, 0)
        ];

        rocket.style.visibility = 'visible';
        rocket.classList.add('is-flying');
        flight = rocket.animate(frames, { duration: DURATION, fill: 'both', easing: 'linear' });
        flight.onfinish = () => {
            rocket.style.visibility = 'hidden';
            rocket.classList.remove('is-flying');
            flight.cancel();
            flight = null;
        };
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (flight) flight.pause();
            return;
        }

        if (flight) flight.play();
        else scheduleFlight(1200);
    });

    window.addEventListener('resize', () => {
        if (isMobile()) {
            clearFlight();
            return;
        }
        if (flightStarted) return;
        clearFlight();
        resizeTimer = window.setTimeout(() => scheduleFlight(800), 250);
    });

    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) {
            clearFlight();
            return;
        }

        scheduleFlight(1200);
    });

    const siteDataPromise = window.tmkSiteDataPromise || fetch('content/site-data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        });

    siteDataPromise
        .then(content => {
            rocketEnabled = content?.features?.rocketEnabled !== false;
            scheduleFlight(1400);
        })
        .catch(error => console.warn('Не удалось загрузить настройку ракеты:', error));
});
