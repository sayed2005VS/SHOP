(function () {
 'use strict';
 var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 function listenMotion(fn) {
  if (motion.addEventListener) { motion.addEventListener('change', fn); }
  else if (motion.addListener) { motion.addListener(fn); }
 }
 function autoplay(step, canRun, delay, button) {
  var timer = null, enabled = !motion.matches, busy = false;
  var buttons=button?(Array.isArray(button)?button:[button]):[];
  function stop() { window.clearInterval(timer); timer = null; }
  function schedule() {
   stop();
   if (enabled && !busy && !motion.matches && !document.hidden && canRun()) {
    timer = window.setInterval(step, delay || 5000);
   }
  }
  function update() {
   buttons.forEach(function (item) {
    item.setAttribute('aria-pressed', String(!enabled));
    item.setAttribute('aria-label', enabled ? 'إيقاف العرض التلقائي' : 'تشغيل العرض التلقائي');
    item.textContent = enabled ? 'إيقاف' : 'تشغيل';
    item.hidden = !canRun();
   });
  }
  buttons.forEach(function (item) { item.addEventListener('click', function () { enabled = !enabled; update(); schedule(); }); });
  document.addEventListener('visibilitychange', schedule);
  listenMotion(function () { if (motion.matches) { enabled = false; } update(); schedule(); });
  window.addEventListener('resize', function () { update(); schedule(); });
  update(); schedule();
  return {restart:function () { update(); schedule(); }, hold:function (value) { busy = value; schedule(); }};
 }
 // Pointer capture is acquired only after a horizontal gesture is confirmed.
 // Vertical touch scrolling and normal links/buttons keep their native behavior.
 function drag(element, handlers, touch) {
  var start = null, moved = false, suppressUntil = 0;
  element.classList.add('can-drag');
  element.addEventListener('dragstart', function (event) { event.preventDefault(); });
  element.addEventListener('pointerdown', function (event) {
   if (event.isPrimary === false || (event.button !== undefined && event.button !== 0)) { return; }
   if (!touch && event.pointerType !== 'mouse') { return; }
   if (event.target.closest(handlers.allowButtons?'input,select,textarea,[role="slider"]':'button,input,select,textarea,[role="slider"]')) { return; }
   start = {x:event.clientX,y:event.clientY,id:event.pointerId}; moved = false;
   if (handlers.start) { handlers.start(); }
  });
  element.addEventListener('pointermove', function (event) {
   if (!start || event.pointerId !== start.id) { return; }
   var dx = event.clientX-start.x, dy = event.clientY-start.y;
   if (!moved && Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)) { finish(event,true); return; }
   if (!moved && Math.abs(dx)>7) {
    moved=true; element.classList.add('is-dragging');
    if (element.setPointerCapture) { element.setPointerCapture(event.pointerId); }
   }
   if (moved) { event.preventDefault(); if (handlers.move) { handlers.move(dx); } }
  }, {passive:false});
  function finish(event, cancelled) {
   if (!start || (event.pointerId !== undefined && event.pointerId !== start.id)) { return; }
   var dx=event.clientX-start.x, id=start.id;
   // A quick swipe can reach pointerup before a pointermove is delivered.
   var horizontal=Math.abs(dx)>40 && Math.abs((event.clientY || start.y)-start.y)<Math.abs(dx);
   if (!cancelled && (moved || horizontal)) {
    suppressUntil=Date.now()+350;
    if (handlers.end) { handlers.end(dx); }
   }
   start=null; moved=false; element.classList.remove('is-dragging');
   if (element.hasPointerCapture && element.hasPointerCapture(id)) { element.releasePointerCapture(id); }
   if (handlers.finish) { handlers.finish(); }
  }
  element.addEventListener('pointerup',function (event) { finish(event,false); });
  element.addEventListener('pointercancel',function (event) { finish(event,true); });
  element.addEventListener('lostpointercapture',function (event) { finish(event,true); });
  element.addEventListener('click',function (event) {
   if (Date.now()<suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  },true);
  window.addEventListener('pointerup',function (event) { finish(event,false); });
 }
 function swipe(element, step, options) {
  options=options || {};
  drag(element,{
   start:options.start,
   end:function (dx) { if (Math.abs(dx)>40) { step(dx<0?1:-1); } },
   finish:options.finish
  },true);
 }
 function rail(element, options) {
  options=options || {};
  var rtl=getComputedStyle(element).direction==='rtl', controls=options.controls || [];
  var button = null;
  if (options.toggle !== false) {
   button=document.createElement('button');
   button.type='button'; button.className='carousel-toggle';
   (options.controlHost || element.parentElement).appendChild(button);
  }
  element.tabIndex=element.tabIndex>=0?element.tabIndex:0;
  if (!element.getAttribute('aria-label')) { element.setAttribute('aria-label',options.label || 'عارض عناصر'); }
  var originals=Array.prototype.slice.call(element.children), loopWidth=0;
  originals.forEach(function (item) { var clone=item.cloneNode(true); clone.setAttribute('aria-hidden','true'); element.appendChild(clone); });
  function measureLoop() { loopWidth=element.scrollWidth/2; }
  function max() { return Math.max(0,element.scrollWidth-element.clientWidth); }
  function pos() { return Math.max(0,Math.min(max(),rtl?-element.scrollLeft:element.scrollLeft)); }
  function jump(value, instant) {
   element.scrollTo({left:(rtl?-1:1)*Math.max(0,Math.min(max(),value)),behavior:instant || motion.matches?'auto':'smooth'});
  }
  function stepSize() {
   var first=element.children[0];
   return first?first.getBoundingClientRect().width+(parseFloat(getComputedStyle(element).columnGap)||0):element.clientWidth;
  }
  function step(direction, loop) {
   var current=pos(), target=current+direction*stepSize();
   if (loop && target>=loopWidth-2) { target=0; }
   if (loop && target<0) { target=loopWidth-stepSize(); }
   jump(target); update();
  }
  var auto=autoplay(function () { step(1,true); },function () { return max()>4; },options.delay || 5000,button);
  function update() {
   controls.forEach(function (control) {
    if (loopWidth) { control.disabled=false; return; }
    var next=(control.dataset.brandsDir || control.dataset.dir)==='next';
    control.disabled=next?pos()>=max()-3:pos()<3;
   });
  }
  controls.forEach(function (control) {
   control.addEventListener('click',function () { step((control.dataset.brandsDir || control.dataset.dir)==='next'?1:-1); auto.restart(); });
  });
  var origin=0;
  drag(element,{
   start:function () { origin=element.scrollLeft; auto.hold(true); },
   move:function (dx) { element.scrollLeft=origin-dx; },
   finish:function () { auto.hold(false); update(); }
  },true);
  element.addEventListener('pointerdown',function (event) { if (event.pointerType!=='mouse') { auto.hold(true); } });
  element.addEventListener('mouseenter',function () { auto.hold(true); });
  element.addEventListener('mouseleave',function () { auto.hold(false); });
  function release() { auto.hold(false); }
  element.addEventListener('pointerup',release);element.addEventListener('pointercancel',release);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  element.addEventListener('wheel',function () { auto.restart(); },{passive:true});
  element.addEventListener('scroll',function () {
   var current=pos();
   if (loopWidth && current>=loopWidth) { jump(current-loopWidth,true); }
   update();
  },{passive:true});
  element.addEventListener('keydown',function (event) {
   if (event.target!==element || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { return; }
   event.preventDefault();
   if (event.key==='Home') { jump(0); } else if (event.key==='End') { jump(max()); }
   else { step(event.key===(rtl?'ArrowLeft':'ArrowRight')?1:-1); }
   auto.restart();
  });
  window.addEventListener('resize',function () { measureLoop(); update(); });
  window.addEventListener('load',function () { measureLoop(); update(); });
  measureLoop();update();
 }
 window.ASCarousel={swipe:swipe,drag:drag,autoplay:autoplay,rail:rail};
 var brands=document.querySelector('.brands--rail');
 if (brands) { rail(brands,{controls:Array.from(document.querySelectorAll('[data-brands-dir]')),controlHost:document.querySelector('.brands__nav'),delay:1500,toggle:false}); }
 var reviews=document.querySelector('.reviews__track');
 if (reviews) { rail(reviews,{controls:Array.from(document.querySelectorAll('.reviews__btn')),controlHost:document.querySelector('.reviews__nav'),delay:1500,toggle:false}); }
 var banks=document.querySelector('.marquee__track');
 if (banks) { rail(banks,{label:'جهات التمويل',delay:1500,toggle:false}); }
 // Tables remain readable without creating horizontal overflow on the page.
 document.querySelectorAll('.prose table').forEach(function (table) {
  var wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','جدول المقارنة، مرّر أفقيًا لعرض التفاصيل');
  table.parentNode.insertBefore(wrap,table);wrap.appendChild(table);
 });
})();

