(function () {
 'use strict';
 var root = document.querySelector('[data-hero-slider]');
 if (!root) { return; }
 var slides = Array.from(root.querySelectorAll('.hero-slider__slide'));
 var dots = Array.from(root.querySelectorAll('[data-hero-dot]'));
 var cta = root.querySelector('[data-hero-cta]');
 var pause = root.querySelector('[data-hero-pause]');
 var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 var current = 0, timer = null, enabled = !motion.matches;
 function stop() { window.clearInterval(timer); timer = null; }
 function schedule() {
  stop();
  if (enabled && !motion.matches && !document.hidden && slides.length > 1) {
   timer = window.setInterval(function () { show(current + 1); }, 6000);
  }
 }
 function updatePause() {
  pause.setAttribute('aria-pressed', String(!enabled));
  pause.setAttribute('aria-label', enabled ? 'إيقاف العرض التلقائي' : 'تشغيل العرض التلقائي');
  pause.classList.toggle('is-paused', !enabled);
 }
 function show(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach(function (slide, i) {
   var active = i === current;
   slide.classList.toggle('is-active', active);
   slide.setAttribute('aria-hidden', String(!active));
   slide.inert = !active;
   if (active) { slide.removeAttribute('inert'); } else { slide.setAttribute('inert', ''); }
  });
  dots.forEach(function (dot, i) {
   dot.classList.toggle('is-active', i === current);
   dot.setAttribute('aria-pressed', String(i === current));
  });
  cta.href = slides[current].dataset.href;
  root.classList.toggle('is-brands', slides[current].classList.contains('hero-slider__slide--brands'));
  root.classList.toggle('is-delivery', slides[current].classList.contains('hero-slider__slide--delivery'));
 }
 function manual(index) { show(index); schedule(); }
 root.querySelector('[data-hero-prev]').addEventListener('click', function () { manual(current - 1); });
 root.querySelector('[data-hero-next]').addEventListener('click', function () { manual(current + 1); });
 dots.forEach(function (dot, i) { dot.addEventListener('click', function () { manual(i); }); });
 pause.addEventListener('click', function () { enabled = !enabled; updatePause(); schedule(); });
 root.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowLeft') { event.preventDefault(); manual(current + 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); manual(current - 1); }
 });
 window.ASCarousel.swipe(root, function (direction) { manual(current + direction); }, {
  start:stop, finish:schedule
 });
 document.addEventListener('visibilitychange', schedule);
 if (motion.addEventListener) { motion.addEventListener('change', function () { if (motion.matches) { enabled = false; } updatePause(); schedule(); }); }
 show(0); updatePause(); schedule();
})();
