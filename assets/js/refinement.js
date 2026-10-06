(function () {
 'use strict';
 document.addEventListener('error', function (event) {
  var img = event.target;
  if (!img || img.tagName !== 'IMG' || img.dataset.fallbackUsed) { return; }
  var match = (img.getAttribute('src') || '').match(/assets\/img\/cars\/(\d+)\//);
  if (!match) { return; }
  var car = (window.STOCK || []).find(function (item) { return item.id === match[1]; });
  if (!car) { return; }
  img.dataset.fallbackUsed = 'true';
  img.src = car.img;
 }, true);
})();
