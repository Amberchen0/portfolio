// ====== progress bar ======
const progressBar = document.querySelector('.progress-bar');
function updateProgress(){
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();

// ====== hero parallax (subtle) ======
const heroImg = document.querySelector('.hero-img-wrap');
const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y < window.innerHeight){
    heroImg.style.transform = `translateY(${y * 0.35}px) scale(1.04)`;
    heroContent.style.transform = `translateY(${y * 0.18}px)`;
    heroContent.style.opacity = `${1 - y / window.innerHeight * 0.8}`;
  }
}, {passive:true});

// ====== mouse parallax on cover ======
const heroEl = document.querySelector('.hero');
heroEl.addEventListener('mousemove', (e) => {
  const rect = heroEl.getBoundingClientRect();
  const x = (e.clientX - rect.width / 2) / rect.width;
  const y = (e.clientY - rect.height / 2) / rect.height;
  const img = document.querySelector('.hero-img');
  img.style.transform = `scale(1.08) translate(${x * -12}px, ${y * -12}px)`;
});
heroEl.addEventListener('mouseleave', () => {
  const img = document.querySelector('.hero-img');
  img.style.transform = `scale(1.08)`;
});

// ====== reveal on scroll ======
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      e.target.classList.add('in-view');
      io.unobserve(e.target);
    }
  });
}, {threshold:.12, rootMargin:'0px 0px -50px 0px'});

document.querySelectorAll(
  '.section-head, .turnaround, .dev-spread, .frame, .tile, .strip-frame, .story-sketch, .about-grid > *'
).forEach(el => io.observe(el));

// ====== storyboard strip: hover-edge auto-scroll ======
const strip = document.querySelector('.strip-track');
const reel = document.querySelector('.strip-reel');
let mouseX = null;
let rafId = null;

function tick(){
  if (mouseX !== null){
    const rect = strip.getBoundingClientRect();
    const w = rect.width;
    const edgeZone = w * 0.32;
    let speed = 0;
    if (mouseX < edgeZone){
      const t = 1 - mouseX / edgeZone;   // 0 at zone boundary → 1 at edge
      speed = -Math.pow(t, 1.6) * 14;
    } else if (mouseX > w - edgeZone){
      const t = (mouseX - (w - edgeZone)) / edgeZone;
      speed = Math.pow(t, 1.6) * 14;
    }
    if (speed !== 0) strip.scrollLeft += speed;
  }
  rafId = requestAnimationFrame(tick);
}

reel.addEventListener('mousemove', e => {
  const rect = strip.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});
reel.addEventListener('mouseenter', () => {
  if (!rafId) tick();
});
reel.addEventListener('mouseleave', () => {
  mouseX = null;
  if (rafId){ cancelAnimationFrame(rafId); rafId = null; }
});

// horizontal scroll via vertical wheel when hovering strip
reel.addEventListener('wheel', e => {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)){
    e.preventDefault();
    strip.scrollLeft += e.deltaY;
  }
}, {passive:false});

// ====== overview row: frost frames not currently visible in the reel ======
const ovFrames = Array.from(document.querySelectorAll('.ov-frame'));
const frameEls = Array.from(strip.querySelectorAll('.strip-frame'));

function updateOverview(){
  const tr = strip.getBoundingClientRect();
  frameEls.forEach((f, i) => {
    const r = f.getBoundingClientRect();
    const overlap = Math.max(0, Math.min(r.right, tr.right) - Math.max(r.left, tr.left));
    const visible = overlap / r.width >= 0.6;   // at least 60% in view
    const ov = ovFrames[i];
    if (ov) ov.classList.toggle('is-visible', visible);
  });
}

strip.addEventListener('scroll', updateOverview, {passive:true});
window.addEventListener('resize', updateOverview);

ovFrames.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const target = frameEls[i];
    if (!target) return;
    const tr = strip.getBoundingClientRect();
    const fr = target.getBoundingClientRect();
    const delta = fr.left - tr.left - (tr.width - fr.width) / 2;
    strip.scrollTo({left: strip.scrollLeft + delta, behavior: 'smooth'});
  });
});

// initial paint — wait for layout
requestAnimationFrame(updateOverview);
window.addEventListener('load', updateOverview);

// ====== lightbox ======
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
window.openLightbox = function(src){
  lightboxImg.src = src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  return false;
};
window.closeLightbox = function(e){
  if (e && e.target.tagName === 'IMG') return;
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// ====== smooth nav highlight ======
const navLinks = document.querySelectorAll('.nav-links a');
const sections = ['about','design','style','set','story'].map(id => document.getElementById(id));
window.addEventListener('scroll', () => {
  const mid = window.scrollY + window.innerHeight * 0.35;
  let active = -1;
  sections.forEach((s,i) => {
    if (s && s.offsetTop <= mid) active = i;
  });
  navLinks.forEach((l,i) => {
    l.style.opacity = (i === active) ? '1' : '';
  });
}, {passive:true});
