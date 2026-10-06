(function () {
 'use strict';
 var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if (!reduced.matches && 'IntersectionObserver' in window) {
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('.why__item,.serv-card,.post,.review,.plan,.req-card').forEach(function(element,index){
   // Only defer off-screen elements; content already visible never waits for an animation.
   if(element.getBoundingClientRect().top<window.innerHeight){return;}
   element.style.setProperty('--reveal-delay',(index%3)*55+'ms');element.classList.add('reveal-on-scroll');observer.observe(element);
  });
  reduced.addEventListener('change',function(){if(reduced.matches){document.querySelectorAll('.reveal-on-scroll').forEach(function(element){element.classList.add('is-visible');});observer.disconnect();}});
 }
})();
