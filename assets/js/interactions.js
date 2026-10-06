(function () {
	'use strict';
	var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
	var selector = [
		'main .section__head', 'main .why__item', 'main .stats > *', 'main .car',
		'main .serv-card', 'main .post', 'main .review', 'main .plan', 'main .req-card',
		'main .btile', 'main .way', 'main .process > li', 'main .steps > li',
		'main .quick__item', 'main .spec__box', 'main .trims > li', 'main .with__item',
		'main .mini-car', 'main .form-card', 'main .calc', 'main .split__media',
		'main .split__content', 'main .request-note', 'main .request-corporate__inner > *',
		'main .request-corporate__contacts > *', 'main [data-reveal] > *'
	].join(',');
	var observer;

	function show(element) {
		element.classList.add('is-visible');
		if (observer) { observer.unobserve(element); }
	}

	function prepare() {
		var elements = Array.prototype.slice.call(document.querySelectorAll(selector));
		if (motion.matches || !('IntersectionObserver' in window)) {
			elements.forEach(show);
			return;
		}
		observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) { show(entry.target); }
			});
		}, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });

		var viewportBottom = window.innerHeight || document.documentElement.clientHeight;
		elements.forEach(function (element) {
			/* Keep the first screen instant and avoid a flash while scripts initialise. */
			if (element.getBoundingClientRect().top < viewportBottom * 0.94) {
				element.classList.add('is-visible');
				return;
			}
			var siblings = element.parentElement ? Array.prototype.filter.call(element.parentElement.children, function (child) {
				return child.matches(selector);
			}) : [];
			var index = Math.max(0, siblings.indexOf(element));
			element.style.setProperty('--reveal-delay', Math.min(index, 4) * 55 + 'ms');
			element.classList.add('reveal-on-scroll');
			observer.observe(element);
		});
	}

	prepare();
	motion.addEventListener('change', function () {
		if (!motion.matches) { return; }
		document.querySelectorAll('.reveal-on-scroll').forEach(show);
		if (observer) { observer.disconnect(); }
	});
})();
