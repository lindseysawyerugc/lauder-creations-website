document.getElementById('year').textContent = new Date().getFullYear();

// Section dot stepper — highlights whichever section is currently crossing
// the vertical center of the screen as you scroll.
const sectionDots = Array.from(document.querySelectorAll('.section-dots a'));
if (sectionDots.length && 'IntersectionObserver' in window) {
  const dotObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const dot = sectionDots.find(a => a.getAttribute('href') === `#${entry.target.id}`);
      if (!dot) return;
      sectionDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sectionDots.forEach(a => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) dotObserver.observe(target);
  });
}

// Floating "Work With Me" button — appears once you've scrolled past the
// hero (where its own CTA already lives), and hides again once the contact
// section (which has its own button) comes into view.
const floatingCta = document.getElementById('floatingCta');
const heroSection = document.getElementById('top');
const contactSection = document.getElementById('contact');

if ('IntersectionObserver' in window && floatingCta && heroSection && contactSection) {
  let pastHero = false;
  let inContact = false;
  const updateFloatingCta = () => {
    floatingCta.classList.toggle('show', pastHero && !inContact);
  };

  new IntersectionObserver((entries) => {
    pastHero = !entries[0].isIntersecting;
    updateFloatingCta();
  }, { threshold: 0 }).observe(heroSection);

  new IntersectionObserver((entries) => {
    inContact = entries[0].isIntersecting;
    updateFloatingCta();
  }, { threshold: 0.1 }).observe(contactSection);

  // Every so often, give it a little shake to call out for a click —
  // only while it's actually visible.
  setInterval(() => {
    if (!floatingCta.classList.contains('show')) return;
    floatingCta.classList.remove('attention');
    void floatingCta.offsetWidth; // restart the animation from scratch
    floatingCta.classList.add('attention');
  }, 6000);
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Portfolio videos play inline in the phone frame.
// Desktop/tablet: tap the play button, it plays once with sound, then resets.
// Phone (swipe carousel): whichever card is centered auto-plays muted & looping,
// like scrolling through reels — swiping to the next resets the last one and
// starts the new one automatically.
const portfolioVideos = Array.from(document.querySelectorAll('.portfolio-video'));
const isMobileCarousel = window.matchMedia('(max-width: 639px)');

// Browsers block autoplay-with-sound until the visitor has tapped/clicked
// anywhere on the page at least once. After that first tap, unlock sound for
// every video from then on, so swiping through the carousel plays with audio
// automatically — no more tapping required.
let audioUnlocked = false;
document.addEventListener('pointerdown', () => {
  audioUnlocked = true;
  // If a card is already auto-playing muted right now, unmute it immediately
  // instead of waiting for the next swipe.
  const activeVideo = portfolioVideos.find(v => !v.paused && v.muted);
  if (activeVideo) activeVideo.muted = false;
}, { once: true, capture: true });

function resetVideo(video) {
  video.pause();
  video.currentTime = 0;
  video.closest('.phone-screen').classList.remove('is-playing');
}

function playVideo(video, { muted, loop }) {
  const screen = video.closest('.phone-screen');
  portfolioVideos.forEach(v => { if (v !== video) resetVideo(v); });
  if (!video.src && video.dataset.src) video.src = video.dataset.src;
  video.muted = muted;
  video.loop = loop;
  screen.classList.add('is-playing');
  video.play().catch(() => screen.classList.remove('is-playing'));
}

portfolioVideos.forEach(video => {
  const screen = video.closest('.phone-screen');
  const playBtn = screen.querySelector('.play-icon');

  // Tap = full experience: unmuted, plays once, resets when done.
  const startWithSound = () => playVideo(video, { muted: false, loop: false });

  playBtn.addEventListener('click', startWithSound);
  video.addEventListener('click', () => {
    if (video.paused || video.muted) startWithSound();
    else resetVideo(video);
  });
  video.addEventListener('ended', () => resetVideo(video));
});

if ('IntersectionObserver' in window && portfolioVideos.length) {
  // Phone only: auto-play the centered card, looping while it's active.
  // Muted until the visitor's first tap on the page, unmuted automatically after.
  const carouselObserver = new IntersectionObserver((entries) => {
    if (!isMobileCarousel.matches) return;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playVideo(entry.target, { muted: !audioUnlocked, loop: true });
      } else {
        resetVideo(entry.target);
      }
    });
  }, { threshold: 0.65 });
  portfolioVideos.forEach(v => carouselObserver.observe(v));

  // Any breakpoint: fully offscreen videos stop rather than play unseen.
  const offscreenObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && !entry.target.paused) resetVideo(entry.target);
    });
  }, { threshold: 0 });
  portfolioVideos.forEach(v => offscreenObserver.observe(v));
}

// Scroll-reveal animations
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Category showcase carousel — several cards visible at once, drifting in one
// continuous smooth motion (like a slowly turning drum) rather than stepping
// and pausing. Loops forever in both directions; grab it with a mouse or a
// swipe to spin it yourself, and it resumes drifting when you let go.
const carousel = document.getElementById('categoryCarousel');
if (carousel) {
  const track = carousel.querySelector('.carousel-track');
  const original = Array.from(track.children);
  const count = original.length;
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  // Clone the set before and after the real slides so there's always real
  // content to drift onto in either direction — the illusion of infinity.
  const cloneBefore = original.map(s => s.cloneNode(true));
  const cloneAfter = original.map(s => s.cloneNode(true));
  track.innerHTML = '';
  [...cloneBefore, ...original, ...cloneAfter].forEach(s => track.appendChild(s));

  const SPEED = 26; // px per second — slow, steady drift
  let slideStep = 0;
  let setWidth = 0;
  let position = 0;
  let dragging = false;
  let tweening = false;
  let dragStartX = 0;
  let dragStartPosition = 0;
  let lastTime = null;
  let inView = false;

  // Don't drift until the visitor actually scrolls to it — otherwise it may
  // have already rotated past Motherhood & Baby before they ever see it.
  // And once it scrolls out of view, reset back to the start so it's always
  // fresh (Motherhood & Baby first) the next time someone scrolls to it.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (!inView && !dragging) {
        position = setWidth;
        render();
      }
    }, { threshold: 0.3 }).observe(carousel);
  } else {
    inView = true;
  }

  function measure() {
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16');
    slideStep = track.children[0].getBoundingClientRect().width + gap;
    setWidth = slideStep * count;
    if (!position) position = setWidth; // start in the middle (real) set
    render();
  }

  function render() {
    track.style.transform = `translateX(-${position}px)`;
  }

  function wrap() {
    if (position >= setWidth * 2) position -= setWidth;
    else if (position < setWidth) position += setWidth;
  }

  function tick(time) {
    if (lastTime === null) lastTime = time;
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    if (inView && !dragging && !tweening) {
      position += SPEED * dt;
      wrap();
      render();
    }
    requestAnimationFrame(tick);
  }

  // Arrow clicks nudge one card-width with a quick ease, then drifting resumes.
  function nudge(dir) {
    tweening = true;
    const start = position;
    const target = position + dir * slideStep;
    const duration = 450;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      position = start + (target - start) * eased;
      wrap();
      render();
      if (t < 1) requestAnimationFrame(step);
      else tweening = false;
    }
    requestAnimationFrame(step);
  }

  prevBtn.addEventListener('click', () => nudge(-1));
  nextBtn.addEventListener('click', () => nudge(1));

  // Drag with mouse or touch — same code path for both via Pointer Events.
  carousel.addEventListener('pointerdown', (e) => {
    dragging = true;
    tweening = false;
    dragStartX = e.clientX;
    dragStartPosition = position;
    carousel.classList.add('dragging');
    carousel.setPointerCapture(e.pointerId);
  });

  carousel.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    position = dragStartPosition - (e.clientX - dragStartX);
    wrap();
    render();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    carousel.classList.remove('dragging');
  }
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', measure);
  measure();
  requestAnimationFrame(tick);
}
