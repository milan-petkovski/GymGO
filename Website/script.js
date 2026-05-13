import './input.css';

/* ═══════════════════════════════════════════
   GymGo — AWWWARDS-LEVEL ANIMATION SYSTEM
   Elite GSAP ScrollTrigger + Micro-interactions
   ═══════════════════════════════════════════ */

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ─── GLOBAL CONFIG ───
const EASE = {
  smooth: 'power3.out',
  elastic: 'elastic.out(1, 0.5)',
  expo: 'expo.out',
  back: 'back.out(1.7)',
  circ: 'circ.out',
  snap: 'power4.out',
  butter: 'power2.out'
};

let isMobile = window.innerWidth <= 1024;
let isTouch = 'ontouchstart' in window;

// Handle dynamic resize for true cross-device stability
window.addEventListener('resize', () => {
  const wasMobile = isMobile;
  isMobile = window.innerWidth <= 1024;
  if (wasMobile !== isMobile) {
    ScrollTrigger.refresh();
  }
}, { passive: true });

// ─── PRELOADER ───
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const logo = document.querySelector('.preloader-logo');
  const percentText = document.getElementById('preloaderPercent');
  
  // ─── SET HERO ELEMENTS HIDDEN (only on pages with hero) ───
  const hasHero = document.querySelector('.hero');
  if (hasHero) {
    const heroTag = hasHero.querySelector('.hero-tag');
    const heroH1 = hasHero.querySelector('h1');
    const heroDesc = hasHero.querySelector('.hero-desc');
    const heroActions = hasHero.querySelector('.hero-actions');
    const heroHighlights = hasHero.querySelector('.hero-highlights');
    const heroImg = hasHero.querySelector('.hero-phone img');
    const hItems = hasHero.querySelectorAll('.h-item');
    const hDividers = hasHero.querySelectorAll('.h-divider');

    if (heroTag) gsap.set(heroTag, { opacity: 0, y: 30 });
    if (heroH1) gsap.set(heroH1, { opacity: 0, y: 60 });
    if (heroDesc) gsap.set(heroDesc, { opacity: 0, y: 30 });
    if (heroActions) gsap.set(heroActions, { opacity: 0, y: 30 });
    if (heroHighlights) gsap.set(heroHighlights, { opacity: 0, y: 30 });
    if (heroImg) gsap.set(heroImg, { opacity: 0, y: 60, scale: 0.9, rotateY: 15, transformPerspective: 1200 });
    if (hItems.length) gsap.set(hItems, { opacity: 0, x: -20 });
    if (hDividers.length) gsap.set(hDividers, { opacity: 0, scaleY: 0 });
  }
  
  if (!preloader || !percentText) {
    document.body.classList.add('is-loaded');
    document.documentElement.classList.add('is-loaded');
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      document.body.classList.add('is-subpage');
    }
    // Reveal hero directly without preloader (only if hero exists)
    if (hasHero) {
      gsap.to('.hero-tag', { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth, delay: 0.2 });
      gsap.to('.hero h1', { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.4 });
      gsap.to('.hero-phone img', { opacity: 1, y: 0, scale: 1, rotateY: 0, duration: 1.4, ease: EASE.butter, delay: 0.3 });
      gsap.to('.hero-desc', { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth, delay: 0.6 });
      gsap.to('.hero-actions', { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth, delay: 0.7 });
      gsap.to('.hero-highlights', { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth, delay: 0.8 });
      gsap.to('.h-item', { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: EASE.back, delay: 0.9 });
      gsap.to('.h-divider', { opacity: 1, scaleY: 1, duration: 0.4, stagger: 0.1, ease: EASE.smooth, delay: 1 });
    }
    initAllAnimations();
    return;
  }
  
  const tl = gsap.timeline();
  
  // 1. Logo entrance with scale bounce
  tl.to(logo, { opacity: 1, scale: 1, duration: 0.8, ease: EASE.back });

  // 2. Counter animation with elastic feel
  let count = { val: 0 };
  gsap.to(count, {
    val: 100,
    duration: 2.2,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (percentText) {
        percentText.innerText = Math.floor(count.val).toString().padStart(2, '0') + '%';
      }
    },
    onComplete: () => {
      const exitTl = gsap.timeline();
      
      exitTl
        // Logo exit
        .to(logo, { y: -20, opacity: 0, duration: 0.4, ease: 'power2.in' })
        .add(() => preloader.classList.add('exit'))
        
        // Wait for preloader fade-out, THEN reveal hero
        .add('heroStart', '+=0.5')
        
        // ─── HERO REVEAL SEQUENCE ───
        .to('.hero-tag', { 
          opacity: 1, y: 0, 
          duration: 0.8, ease: EASE.smooth 
        }, 'heroStart')
        
        .to('.hero h1', { 
          opacity: 1, y: 0, 
          duration: 1.2, ease: 'power4.out' 
        }, 'heroStart+=0.15')
        
        .to('.hero-desc', { 
          opacity: 1, y: 0, 
          duration: 0.8, ease: EASE.smooth 
        }, 'heroStart+=0.35')
        
        .to('.hero-phone img', { 
          opacity: 1, y: 0, scale: 1, rotateY: 0, 
          duration: 1.4, ease: EASE.butter 
        }, 'heroStart+=0.2')
        
        .to('.hero-actions', { 
          opacity: 1, y: 0, 
          duration: 0.8, ease: EASE.smooth 
        }, 'heroStart+=0.5')
        
        .to('.hero-highlights', { 
          opacity: 1, y: 0, 
          duration: 0.8, ease: EASE.smooth 
        }, 'heroStart+=0.6')
        
        // Stagger the individual highlight items
        .fromTo('.h-item', 
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: EASE.back },
          'heroStart+=0.7'
        )
        
        // Dividers scale in
        exitTl.to('.h-divider', {
          opacity: 1, scaleY: 1,
          duration: 0.4, stagger: 0.1, ease: EASE.smooth
        }, 'heroStart+=0.9');
        
        exitTl.add(() => {
          preloader.classList.add('hidden');
          document.body.classList.add('is-loaded');
          document.documentElement.classList.add('is-loaded');
          
          initAllAnimations();
          
          // Floating phone animation (infinite)
          gsap.to('.hero-phone img', {
            y: '+=20',
            duration: 3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
          });
        });
    }
  });
});


// ═══════════════════════════════════════════
// MASTER ANIMATION INITIALIZATION
// ═══════════════════════════════════════════
function initAllAnimations() {
  // Clear CSS .reveal state — GSAP takes full control
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    gsap.set(reveals, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' });
  }
  
  // Kill existing triggers to prevent double initialization on resize/refresh
  ScrollTrigger.getAll().forEach(t => {
    if (t.vars.id !== 'preloader') t.kill();
  });

  ScrollTrigger.refresh();
  
  initSectionHeaders();
  initSubpageHero();
  initGenericReveals();
  initFeatureCards();
  initShowcaseSections();
  initTechSection();
  initMarqueeBand();
  initPremiumCards();
  initTestimonials();
  initFAQ();
  initDownloadCTA();
  initFooter();
  initParallaxEffects();
  initNavbarEffects();
}


// ═══════════════════════════════════════════
// 1. SECTION HEADERS — Elegant Split Reveal
// ═══════════════════════════════════════════
function initSectionHeaders() {
  const headers = document.querySelectorAll('.features-header, .premium-header, .testimonials-header, .faq-header');
  
  headers.forEach(header => {
    const tag = header.querySelector('.section-tag');
    const title = header.querySelector('.section-title');
    const desc = header.querySelector('.section-desc');
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
    
    if (tag) tl.fromTo(tag, 
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: EASE.back }
    );
    
    if (title) tl.fromTo(title,
      { opacity: 0, y: 50, clipPath: 'inset(0 0 100% 0)' },
      { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: EASE.expo },
      '-=0.5'
    );
    
    if (desc) tl.fromTo(desc,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth },
      '-=0.6'
    );
  });
}


// ═══════════════════════════════════════════
// 1.1 SUBPAGE HERO — Cinematic Entrance
// ═══════════════════════════════════════════
function initSubpageHero() {
  const hero = document.querySelector('.support-hero, .legal-content');
  if (!hero) return;

  const tag = hero.querySelector('.section-tag');
  const title = hero.querySelector('h1, .section-title');
  const desc = hero.querySelector('.section-desc, p');

  const tl = gsap.timeline({ delay: 0.2 });

  if (tag) tl.fromTo(tag, 
    { opacity: 0, y: 20, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: EASE.back }
  );

  if (title) tl.fromTo(title,
    { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' },
    { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: EASE.expo },
    '-=0.6'
  );

  if (desc) tl.fromTo(desc,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth },
    '-=0.8'
  );
}


// ═══════════════════════════════════════════
// 1.2 GENERIC REVEALS — For all remaining .reveal items
// ═══════════════════════════════════════════
function initGenericReveals() {
  // Select all .reveal that aren't already part of a complex timeline
  const items = document.querySelectorAll('.reveal:not(.section-tag):not(.section-title):not(.section-desc):not(.feature-card):not(.premium-card):not(.faq-item):not(.showcase-img):not(.showcase-content):not(.marquee-band)');
  
  items.forEach(item => {
    gsap.fromTo(item,
      { opacity: 0, y: 20, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: EASE.smooth,
        scrollTrigger: {
          trigger: item,
          start: 'top 92%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}
function initFeatureCards() {
  const grid = document.querySelector('.features-grid');
  if (!grid) return;
  
  const cards = grid.querySelectorAll('.feature-card');
  
  cards.forEach((card, i) => {
    // Initial state
    gsap.set(card, { 
      opacity: 0, 
      y: 80, 
      scale: 0.92,
      rotateX: 8,
      transformPerspective: 1000,
      transformOrigin: 'center bottom'
    });
    
    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      duration: 1.2,
      delay: i * 0.12,
      ease: EASE.expo,
      scrollTrigger: {
        trigger: grid,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
    
    // Icon & inner elements stagger
    const icon = card.querySelector('.feature-icon');
    const h3 = card.querySelector('h3');
    const p = card.querySelector('p');
    const link = card.querySelector('.feature-link');
    
    const innerTl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
    
    if (icon) innerTl.fromTo(icon,
      { scale: 0, rotation: -45 },
      { scale: 1, rotation: 0, duration: 0.8, ease: EASE.elastic, delay: i * 0.12 + 0.3 }
    );
    
    if (h3) innerTl.fromTo(h3,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: EASE.smooth },
      '-=0.4'
    );
    
    if (p) innerTl.fromTo(p,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: EASE.butter },
      '-=0.3'
    );
    
    if (link) innerTl.fromTo(link,
      { opacity: 0, x: -15 },
      { opacity: 1, x: 0, duration: 0.5, ease: EASE.smooth },
      '-=0.2'
    );
  });
}


// ═══════════════════════════════════════════
// 3. SHOWCASE SECTIONS — Cinematic Split Reveals
// ═══════════════════════════════════════════
function initShowcaseSections() {
  document.querySelectorAll('.showcase').forEach(section => {
    const imgWrap = section.querySelector('.showcase-img');
    const img = section.querySelector('.showcase-img img');
    const contentWrap = section.querySelector('.showcase-content');
    const isReverse = section.querySelector('.showcase-grid.reverse');
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play none none none'
      }
    });
    
    // Image wrapper + image: Slide in from opposite side
    if (imgWrap && img) {
      const xDir = isReverse ? 80 : -80;
      gsap.set(imgWrap, { opacity: 0, x: xDir });
      tl.to(imgWrap, { opacity: 1, x: 0, duration: 0.01 });
      tl.fromTo(img,
        { opacity: 0, x: xDir, scale: 0.85, rotateY: isReverse ? -10 : 10 },
        { opacity: 1, x: 0, scale: 1, rotateY: 0, duration: 1.4, ease: EASE.expo },
        '<'
      );
      tl.to(imgWrap, { opacity: 1, x: 0, duration: 1.4, ease: EASE.expo }, '<');
    }
    
    // Content wrapper + children
    if (contentWrap) {
      gsap.set(contentWrap, { opacity: 0, y: 40 });
      tl.to(contentWrap, { opacity: 1, y: 0, duration: 0.01 }, '<+0.2');
      
      const tag = contentWrap.querySelector('.section-tag');
      const title = contentWrap.querySelector('.section-title');
      const desc = contentWrap.querySelector('.section-desc');
      const listItems = contentWrap.querySelectorAll('.showcase-list li');
      
      tl.to(contentWrap, { opacity: 1, y: 0, duration: 1, ease: EASE.expo }, '<');
      
      if (tag) tl.fromTo(tag,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE.smooth },
        '-=0.7'
      );
      
      if (title) tl.fromTo(title,
        { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1, ease: EASE.expo },
        '-=0.4'
      );
      
      if (desc) tl.fromTo(desc,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: EASE.smooth },
        '-=0.5'
      );
      
      if (listItems.length) {
        tl.fromTo(listItems,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: EASE.back },
          '-=0.3'
        );
      }
    }
  });
}


// ═══════════════════════════════════════════
// 4. TECH SECTION — Dramatic Dark Entry
// ═══════════════════════════════════════════
function initTechSection() {
  const section = document.querySelector('.app-preview');
  if (!section) return;
  
  const contentWrap = section.querySelector('.app-preview-content');
  const tag = section.querySelector('.section-tag');
  const title = section.querySelector('.section-title');
  const desc = section.querySelector('.section-desc');
  const items = section.querySelectorAll('.tech-item');
  
  // Ensure the .reveal wrapper is visible
  if (contentWrap) gsap.set(contentWrap, { opacity: 1, y: 0 });
  
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
      toggleActions: 'play none none none'
    }
  });
  
  if (tag) tl.fromTo(tag,
    { opacity: 0, y: 30, letterSpacing: '15px' },
    { opacity: 1, y: 0, letterSpacing: '5px', duration: 1, ease: EASE.expo }
  );
  
  if (title) tl.fromTo(title,
    { opacity: 0, y: 60, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: EASE.expo },
    '-=0.7'
  );
  
  if (desc) tl.fromTo(desc,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth },
    '-=0.6'
  );
  
  items.forEach((item, i) => {
    const icon = item.querySelector('.tech-icon');
    
    tl.fromTo(item,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.8, ease: EASE.back },
      `-=${0.6 - i * 0.1}`
    );
    
    if (icon) tl.fromTo(icon,
      { scale: 0, rotation: -90 },
      { scale: 1, rotation: 0, duration: 0.8, ease: EASE.elastic },
      '-=0.6'
    );
  });
}


// ═══════════════════════════════════════════
// 4b. MARQUEE BAND — Scroll Triggered Entrance
// ═══════════════════════════════════════════
function initMarqueeBand() {
  const band = document.querySelector('.stats-band');
  if (!band) return;
  
  gsap.fromTo(band,
    { opacity: 0, scaleX: 0.9 },
    {
      opacity: 1,
      scaleX: 1,
      duration: 1.2,
      ease: EASE.expo,
      scrollTrigger: {
        trigger: band,
        start: 'top 90%',
        toggleActions: 'play none none none'
      }
    }
  );
}


// ═══════════════════════════════════════════
// 5. PREMIUM CARDS — Luxury Cascade
// ═══════════════════════════════════════════
function initPremiumCards() {
  const grid = document.querySelector('.premium-grid');
  if (!grid) return;
  
  const cards = grid.querySelectorAll('.premium-card');
  
  cards.forEach((card, i) => {
    gsap.set(card, {
      opacity: 0,
      y: 70,
      scale: 0.9,
      rotateX: 5,
      transformPerspective: 800
    });
    
    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      duration: 1,
      delay: i * 0.1,
      ease: EASE.expo,
      scrollTrigger: {
        trigger: grid,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
    
    // Icon pulse on reveal
    const icon = card.querySelector('.p-icon');
    if (icon) {
      gsap.fromTo(icon,
        { scale: 0 },
        { 
          scale: 1, 
          duration: 0.7, 
          ease: EASE.elastic, 
          delay: i * 0.1 + 0.5,
          scrollTrigger: {
            trigger: grid,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });
  
  // Premium footer CTA
  const footer = document.querySelector('.premium-footer');
  if (footer) {
    gsap.fromTo(footer,
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 1, ease: EASE.back,
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}


// ═══════════════════════════════════════════
// 6. TESTIMONIALS — Smooth Card Fan
// ═══════════════════════════════════════════
function initTestimonials() {
  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;
  
  const cards = grid.querySelectorAll('.testimonial-card');
  
  cards.forEach((card, i) => {
    // Cards slide in with rotation
    gsap.fromTo(card,
      { 
        opacity: 0, 
        y: 60, 
        rotateZ: i === 0 ? -3 : i === 2 ? 3 : 0,
        scale: 0.9 
      },
      {
        opacity: 1,
        y: 0,
        rotateZ: 0,
        scale: 1,
        duration: 1.2,
        delay: i * 0.15,
        ease: EASE.expo,
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
    
    // Stars animate in sequence
    const stars = card.querySelectorAll('.testimonial-stars i');
    if (stars.length > 0) {
      gsap.fromTo(stars,
        { opacity: 0, scale: 0, rotation: -180 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: EASE.back,
          delay: i * 0.15 + 0.5,
          scrollTrigger: {
            trigger: grid,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });
}


// ═══════════════════════════════════════════
// 7. FAQ — Accordion Slide with Spring
// ═══════════════════════════════════════════
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  
  items.forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: i % 2 === 0 ? -40 : 40, scale: 0.95 },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        delay: i * 0.1,
        ease: EASE.expo,
        scrollTrigger: {
          trigger: item,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
  
  // FAQ accordion click handler
  items.forEach(item => {
    const question = item.querySelector('.faq-q');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all
        items.forEach(other => other.classList.remove('active'));
        
        // Toggle current
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}


// ═══════════════════════════════════════════
// 8. DOWNLOAD CTA — Grand Reveal
// ═══════════════════════════════════════════
function initDownloadCTA() {
  const section = document.querySelector('.download');
  if (!section) return;
  
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      toggleActions: 'play none none none'
    }
  });
  
  tl.fromTo(section.querySelector('.section-tag'),
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth }
  );
  
  tl.fromTo(section.querySelector('.section-title'),
    { opacity: 0, y: 60, scale: 0.85 },
    { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: EASE.expo },
    '-=0.5'
  );
  
  tl.fromTo(section.querySelector('.section-desc'),
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth },
    '-=0.6'
  );
  
  const storeBtn = section.querySelector('.store-btn');
  if (storeBtn) {
    tl.fromTo(storeBtn,
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: EASE.back },
      '-=0.3'
    );
  }
}


// ═══════════════════════════════════════════
// 9. FOOTER — Elegant Rise
// ═══════════════════════════════════════════
function initFooter() {
  const footer = document.querySelector('.footer');
  if (!footer) return;
  
  const cols = footer.querySelectorAll('.footer-col');
  const info = footer.querySelector('.footer-info');
  const bottom = footer.querySelector('.footer-bottom');
  
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: 'top 85%',
      toggleActions: 'play none none none'
    }
  });
  
  if (info) tl.fromTo(info,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth }
  );
  
  cols.forEach((col, i) => {
    tl.fromTo(col,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: EASE.smooth },
      `-=${0.4}`
    );
    
    // Stagger footer links
    const links = col.querySelectorAll('a');
    if (links.length > 0) {
      tl.fromTo(links,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: EASE.smooth },
        '-=0.3'
      );
    }
  });
  
  if (bottom) tl.fromTo(bottom,
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: EASE.smooth },
    '-=0.2'
  );
}


// ═══════════════════════════════════════════
// 10. PARALLAX EFFECTS — Subtle Depth
// ═══════════════════════════════════════════
function initParallaxEffects() {
  // Hero phone parallax
  const heroPhone = document.querySelector('.hero-phone');
  if (heroPhone) {
    gsap.to(heroPhone, {
      y: -80,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5
      }
    });
  }
  
  // Showcase images parallax
  document.querySelectorAll('.showcase-img img').forEach(img => {
    gsap.to(img, {
      y: -40,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: img.closest('.showcase'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });
  });
  
  // Glow blobs gentle parallax
  document.querySelectorAll('.glow-blob').forEach((blob, i) => {
    gsap.to(blob, {
      y: -120 * (i + 1) * 0.3,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 3
      }
    });
  });
  
  // Section tags parallax (slight upward movement)
  document.querySelectorAll('.section-tag').forEach(tag => {
    gsap.to(tag, {
      y: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: tag,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });
  });
}


// ═══════════════════════════════════════════
// 11. NAVBAR — Smart Scroll Effects
// ═══════════════════════════════════════════
function initNavbarEffects() {
  const navbar = document.getElementById('navbar') || document.querySelector('.nav');
  if (!navbar) return;
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      if (!document.body.classList.contains('is-subpage')) {
        navbar.classList.remove('scrolled');
      }
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}


// ═══════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');

if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    gsap.fromTo(mobileMenu.querySelectorAll('a'), 
      { opacity: 0, y: 30, scale: 0.8 }, 
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.1, 
        ease: EASE.back, 
        delay: 0.2 
      }
    );
  });
}
if (closeMenu && mobileMenu) {
  closeMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = ''; // Restore scroll
  });
}


// ═══════════════════════════════════════════
// SMOOTH SCROLL
// ═══════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return; // Do nothing for empty anchors
    
    e.preventDefault();
    try {
      const target = document.querySelector(href);
      if (target) {
        gsap.to(window, { 
          duration: 1, 
          scrollTo: { y: target, offsetY: 100 }, 
          ease: 'power4.inOut' 
        });
        
        // Close mobile menu if open
        if (typeof mobileMenu !== 'undefined' && mobileMenu) {
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
        }
      }
    } catch (err) {
      console.warn('Invalid scroll target:', href);
    }
  });
});


// ═══════════════════════════════════════════
// BACK TO TOP
// ═══════════════════════════════════════════
const backToTopBtn = document.getElementById('backToTopLink');
if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 800) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
  });
  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    gsap.to(window, { duration: 1.2, scrollTo: 0, ease: 'power4.inOut' });
  });
}


// ═══════════════════════════════════════════
// CHAT WIDGET
// ═══════════════════════════════════════════
const chatWidget = document.getElementById('chatWidget');
const supportToggle = document.getElementById('supportToggle');
const closeWidget = document.getElementById('closeWidget');
const triggerChat = document.getElementById('triggerChat');

if (chatWidget) {
  if (supportToggle) {
    supportToggle.addEventListener('click', (e) => {
      e.preventDefault();
      chatWidget.classList.toggle('active');
    });
  }
  
  if (triggerChat) {
    triggerChat.addEventListener('click', (e) => {
      e.preventDefault();
      chatWidget.classList.add('active');
    });
  }

  if (closeWidget) {
    closeWidget.addEventListener('click', () => {
      chatWidget.classList.remove('active');
    });
  }
}



if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
