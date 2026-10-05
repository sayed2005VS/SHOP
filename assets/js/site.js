/* Shared by every page: header behaviour, mobile menu, opening hours, and small helpers (window.AS). */
(function () {
	'use strict';

	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduce;
	if (hasGsap) {
		gsap.registerPlugin(ScrollTrigger);
		document.documentElement.classList.add('has-gsap');
	}

	var fmt = new Intl.NumberFormat('en-US');
	var WA = 'https://wa.me/966920035742?text=';

	function esc(s) {
		return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
	}

	function carsLabel(n) {
		if (n === 1) { return 'سيارة واحدة'; }
		if (n === 2) { return 'سيارتان'; }
		if (n <= 10) { return n + ' سيارات'; }
		return n + ' سيارة';
	}

	function carUrl(id) { return 'car.html?id=' + id; }

	// Indicative monthly payment: flat annual profit rate, 10% down, 5 years unless told otherwise.
	var RATE = 0.045;
	function monthly(price, downPct, months) {
		var financed = price * (1 - (downPct === undefined ? 0.1 : downPct / 100));
		var m = months || 60;
		return Math.round((financed + financed * RATE * (m / 12)) / m);
	}

	// Image-led car card used on the homepage and in "similar cars".
	function carCard(c) {
		var meta = [c.body, c.gearbox, c.fuel].filter(Boolean).join(' · ');
		var price = c.price
			? '<span class="car__price-label">' + (c.was ? '<s>' + fmt.format(c.was) + '</s> ' : '') + 'كاش شامل الضريبة</span><span class="car__price-value">' + fmt.format(c.price) + ' <small>ريال</small></span>' +
				'<span class="car__monthly">أو ' + fmt.format(monthly(c.price)) + ' ريال شهريًا</span>'
			: '<span class="car__price-label">كاش أو تقسيط</span><span class="car__price-value">اطلب عرض سعر</span>';
		var msg = encodeURIComponent('مرحبًا، أرغب في طلب ' + c.name);
		return '<article class="car" data-brand="' + c.brand + '">' +
			'<div class="car__media"><img class="car__img" src="' + c.img + '" alt="' + esc(c.name) + '" loading="lazy" width="' + (c.w || 1200) + '" height="' + (c.h || 900) + '"><span class="car__sheen" aria-hidden="true"></span></div>' +
			'<div class="car__top">' +
				'<div><h3 class="car__title"><a href="' + carUrl(c.id) + '">' + esc(c.name) + '</a></h3><p class="car__meta">' + esc(meta) + '</p></div>' +
				'<div class="car__badges">' + (c.was ? '<span class="badge badge--red">خصم ' + fmt.format(c.was - c.price) + ' ريال</span>' : '<span class="badge badge--red">جديد</span>') + '<span class="badge">ضمان الوكيل</span></div>' +
			'</div>' +
			'<div class="car__bottom">' +
				'<div class="car__price">' + price + '</div>' +
				'<div class="car__actions">' +
					'<a href="' + WA + msg + '" class="btn btn--light" target="_blank" rel="noopener">اطلب الآن</a>' +
					'<a href="' + carUrl(c.id) + '" class="btn btn--glass">التفاصيل</a>' +
				'</div>' +
			'</div>' +
		'</article>';
	}

	function onView(trigger, start, fn) {
		if (!hasGsap) { return; }
		ScrollTrigger.create({ trigger: trigger, start: start || 'top 82%', once: true, onEnter: fn });
	}

	// Section headings: words rise from behind a mask; the eyebrow and "more" link follow.
	function revealHeadings(selector) {
		if (!hasGsap) { return; }
		gsap.utils.toArray(selector || '.section__title').forEach(function (title) {
			title.innerHTML = title.textContent.trim().split(/\s+/).map(function (w) {
				return '<span class="w"><span>' + esc(w) + '</span></span>';
			}).join(' ');
			var words = title.querySelectorAll('.w > span');
			var head = title.closest('.section__head, .show__head, .why__content, .fin__info, .corp__text, .visit__card, [data-head]') || title.parentElement;
			var eyebrow = head.querySelector('.eyebrow');
			var more = head.querySelector('.link-more');
			gsap.set(words, { yPercent: 115 });
			if (eyebrow) { gsap.set(eyebrow, { opacity: 0, y: 12 }); }
			if (more) { gsap.set(more, { opacity: 0 }); }
			onView(title, 'top 88%', function () {
				var tl = gsap.timeline();
				if (eyebrow) { tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0); }
				tl.to(words, { yPercent: 0, duration: 1, stagger: 0.07, ease: 'power4.out' }, 0.08);
				if (more) { tl.to(more, { opacity: 1, duration: 0.6 }, 0.5); }
			});
		});
	}

	window.AS = {
		reduce: reduce, hasGsap: hasGsap, fmt: fmt, WA: WA, esc: esc, carsLabel: carsLabel,
		carUrl: carUrl, monthly: monthly, carCard: carCard, onView: onView, revealHeadings: revealHeadings
	};

	/* ---------- Header: solid after the top, hides while scrolling down ---------- */
	var header = document.getElementById('header');
	var lastY = window.scrollY;
	var navOpen = false;
	function onScroll() {
		var y = window.scrollY;
		header.classList.toggle('is-solid', y > 40 || navOpen);
		if (!navOpen) {
			if (y > lastY + 4 && y > 700) { header.classList.add('is-hidden'); }
			else if (y < lastY - 4 || y < 700) { header.classList.remove('is-hidden'); }
		}
		lastY = y;
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();

	/* ---------- Mobile menu ---------- */
	var burger = document.getElementById('burger');
	var nav = document.getElementById('nav');
	burger.addEventListener('click', function () {
		navOpen = burger.getAttribute('aria-expanded') !== 'true';
		burger.setAttribute('aria-expanded', String(navOpen));
		burger.setAttribute('aria-label', navOpen ? 'إغلاق القائمة' : 'فتح القائمة');
		nav.classList.toggle('is-open', navOpen);
		header.classList.remove('is-hidden');
		header.classList.toggle('is-solid', navOpen || window.scrollY > 40);
		document.body.style.overflow = navOpen ? 'hidden' : '';
	});

	/* ---------- Open / closed now (Riyadh time) ---------- */
	(function () {
		var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
		var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
		var day = get('weekday');
		var mins = (+get('hour') % 24) * 60 + (+get('minute'));
		var openAt = day === 'Fri' ? 16 * 60 : 9 * 60;
		var closeAt = 21 * 60;
		var isOpen = mins >= openAt && mins < closeAt;
		var text;
		if (isOpen) {
			text = 'مفتوح الآن · حتى 9 مساءً';
		} else if (mins < openAt) {
			text = 'مغلق الآن · نفتح ' + (day === 'Fri' ? '4 عصرًا' : '9 صباحًا');
		} else {
			text = 'مغلق الآن · نفتح ' + (day === 'Thu' ? 'الجمعة 4 عصرًا' : '9 صباحًا');
		}
		var dot = document.querySelector('[data-open-dot]');
		var label = document.querySelector('[data-open-text]');
		var badge = document.querySelector('[data-open-badge]');
		if (dot) { dot.classList.toggle('is-open', isOpen); }
		if (label) { label.textContent = text; }
		if (badge) { badge.textContent = text; badge.classList.add(isOpen ? 'is-open' : 'is-closed'); }
	})();
})();
