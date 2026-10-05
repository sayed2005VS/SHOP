/* Shared behaviour for the inner pages: WhatsApp forms, tabs, brand grid, offer cars,
   installment calculator, guide filter, FAQ nav, and each page's entrance motion. */
(function () {
	'use strict';

	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var fmt = AS.fmt;
	var C = window.CATALOG;
	var STOCK = window.STOCK || [];

	/* ---------- Forms → WhatsApp message, then a thank-you state ---------- */
	$$('[data-wa-form]').forEach(function (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var bad = null;
			$$('[required]', form).forEach(function (el) { if (!bad && !el.value.trim()) { bad = el; } });
			var phone = $('[data-phone]', form);
			if (!bad && phone && !/^(05\d{8}|\+?9665\d{8})$/.test(phone.value.replace(/\s/g, ''))) { bad = phone; }
			$('[data-error]', form).hidden = !bad;
			if (bad) { bad.focus(); return; }
			var lines = [form.dataset.waForm];
			$$('input, select, textarea', form).forEach(function (el) {
				if (el.name && el.value.trim()) { lines.push(el.name + ': ' + el.value.trim()); }
			});
			window.open(AS.WA + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
			form.innerHTML = '<div class="form-done"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z"/></svg>' +
				'<strong>تم تجهيز طلبك</strong><p>أكمل الإرسال من واتساب، ويتواصل معك فريقنا قريبًا.</p></div>';
		});
	});

	/* ---------- Tabs that swap form panels ---------- */
	$$('[data-tabs]').forEach(function (tabs) {
		var scope = tabs.parentElement;
		$$('button', tabs).forEach(function (btn) {
			btn.addEventListener('click', function () {
				$$('button', tabs).forEach(function (b) {
					b.classList.toggle('is-active', b === btn);
					b.setAttribute('aria-selected', String(b === btn));
				});
				$$('[data-panel]', scope).forEach(function (p) { p.hidden = p.dataset.panel !== btn.dataset.tab; });
			});
		});
	});

	/* ---------- Brands page ---------- */
	var brandGrid = $('[data-brand-grid]');
	if (brandGrid && C) {
		var counts = C.countBy(STOCK, 'brand');
		var originCounts = C.countBy(STOCK, 'origin');
		$$('[data-origin-count]').forEach(function (el) { el.textContent = AS.carsLabel(originCounts[el.dataset.originCount] || 0); });
		var total = $('[data-stock-total]');
		if (total) { total.textContent = STOCK.length; }
		brandGrid.innerHTML = Object.keys(C.BRANDS).map(function (b) {
			var info = C.BRANDS[b];
			var n = counts[b] || 0;
			return '<li class="btile" data-origin="' + info.origin + '"><a href="cars.html?brand=' + b + '">' +
				'<img src="assets/img/logos/brands/' + b + '.png" alt="" loading="lazy">' +
				'<div><strong>' + info.ar + '</strong><span>' + C.ORIGINS[info.origin].ar + '</span></div>' +
				'<em>' + (n ? AS.carsLabel(n) : 'اطلبها') + '</em></a></li>';
		}).join('');
		var tabs = $$('[data-brand-tabs] .chip');
		tabs.forEach(function (t) {
			t.addEventListener('click', function () {
				tabs.forEach(function (x) { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', String(x === t)); });
				var tiles = $$('.btile', brandGrid);
				tiles.forEach(function (tile) { tile.hidden = !!t.dataset.origin && tile.dataset.origin !== t.dataset.origin; });
				if (AS.hasGsap) {
					gsap.fromTo(tiles.filter(function (x) { return !x.hidden; }), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.03, ease: 'back.out(1.8)' });
				}
			});
		});
	}

	/* ---------- Offers page: cars with a discount ---------- */
	var offerGrid = $('[data-offer-cars]');
	if (offerGrid) {
		offerGrid.innerHTML = STOCK.filter(function (c) { return c.was; }).slice(0, 6).map(AS.carCard).join('');
	}

	/* ---------- Article sidebar: small car list ---------- */
	$$('[data-mini-cars]').forEach(function (box) {
		var ids = box.dataset.miniCars.split(',');
		box.innerHTML = ids.map(function (id) {
			var c = STOCK.filter(function (x) { return x.id === id; })[0];
			if (!c) { return ''; }
			return '<a class="mini-car" href="' + AS.carUrl(c.id) + '"><img src="' + c.img + '" alt="" loading="lazy">' +
				'<span><strong>' + AS.esc(c.name) + '</strong><span>' + (c.price ? fmt.format(c.price) + ' ريال' : 'اطلب عرض سعر') + '</span></span></a>';
		}).join('');
	});

	/* ---------- Installment calculator (financing page) ---------- */
	var price = $('#price');
	if (price) {
		var down = $('#down');
		var out = $('#o-monthly');
		var shown = { v: 0 };
		var fill = function (el) { el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); };
		var calc = function () {
			var p = +price.value;
			var d = p * (+down.value / 100);
			var m = +$('input[name="term"]:checked').value;
			var monthly = AS.monthly(p, +down.value, m);
			$('#o-price').textContent = fmt.format(p) + ' ريال';
			$('#o-down').textContent = down.value + '% (' + fmt.format(Math.round(d)) + ' ريال)';
			fill(price); fill(down);
			if (AS.hasGsap) {
				gsap.to(shown, { v: monthly, duration: 0.45, ease: 'power2.out', onUpdate: function () { out.textContent = fmt.format(Math.round(shown.v)) + ' ريال'; } });
			} else { out.textContent = fmt.format(monthly) + ' ريال'; }
		};
		[price, down].forEach(function (el) { el.addEventListener('input', calc); });
		$$('input[name="term"]').forEach(function (el) { el.addEventListener('change', calc); });
		calc();
	}

	/* ---------- Guide: category filter ---------- */
	var gf = $$('[data-guide-filter] .chip');
	gf.forEach(function (chip) {
		chip.addEventListener('click', function () {
			gf.forEach(function (x) { x.classList.toggle('is-active', x === chip); x.setAttribute('aria-selected', String(x === chip)); });
			var posts = $$('.guide-list .post');
			posts.forEach(function (p) { p.hidden = !!chip.dataset.cat && p.dataset.cat !== chip.dataset.cat; });
			if (AS.hasGsap) {
				gsap.fromTo(posts.filter(function (p) { return !p.hidden; }), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' });
			}
		});
	});

	/* ---------- FAQ: highlight the section in view ---------- */
	var faqLinks = $$('[data-faq-nav] a');
	if (faqLinks.length && 'IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting) {
					faqLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
				}
			});
		}, { rootMargin: '-30% 0px -60% 0px' });
		faqLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) { io.observe(t); } });
	}

	/* ==========================================================================
	   Motion — one entrance per kind of block, so pages don't all fade the same way.
	   ========================================================================== */
	if (!AS.hasGsap) { return; }
	AS.revealHeadings('.section__title, .phead__title, .cta-band h2');

	// Page head: the photo settles from a slow push-in; text lines follow.
	gsap.timeline({ defaults: { ease: 'power3.out' } })
		.fromTo('.phead__bg', { scale: 1.15 }, { scale: 1, duration: 2.2, ease: 'power2.out' }, 0)
		.from('.phead .crumbs, .phead .post__tag', { opacity: 0, y: 10, duration: 0.6, stagger: 0.08 }, 0.15)
		.from('.phead__lead, .article__meta', { opacity: 0, y: 14, duration: 0.8 }, 0.55)
		.from('.phead__facts li', { opacity: 0, y: 18, duration: 0.7, stagger: 0.1 }, 0.7)
		.from('.phead__actions .btn', { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, 0.8);

	var onView = AS.onView;
	var desktop = window.matchMedia('(min-width: 1081px)').matches;

	// rise: cards lift in a row · clip: photos unveil upward · pop: tiles spring in · count: numbers roll up
	$$('[data-reveal]').forEach(function (group) {
		var kind = group.dataset.reveal;
		var items = Array.prototype.slice.call(group.children);
		if (kind === 'rise') {
			gsap.set(items, { opacity: 0, y: 50 });
			onView(group, 'top 85%', function () { gsap.to(items, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out', clearProps: 'transform' }); });
		} else if (kind === 'clip') {
			gsap.set(items, { clipPath: 'inset(100% 0% 0% 0% round 12px)' });
			onView(group, 'top 82%', function () {
				gsap.to(items, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.2, stagger: 0.1, ease: 'power4.inOut', clearProps: 'clipPath' });
			});
		} else if (kind === 'pop') {
			gsap.set(items, { opacity: 0, scale: 0.85 });
			onView(group, 'top 88%', function () { gsap.to(items, { opacity: 1, scale: 1, duration: 0.7, stagger: { each: 0.05, from: 'center' }, ease: 'back.out(1.7)', clearProps: 'transform' }); });
		} else if (kind === 'count') {
			onView(group, 'top 85%', function () {
				$$('[data-count-to]', group).forEach(function (el) {
					var o = { v: 0 };
					gsap.to(o, { v: +el.dataset.countTo, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
				});
			});
		}
	});

	// Split blocks: photo slides in from its own side, text follows.
	$$('.split').forEach(function (split) {
		var media = $('.split__media', split);
		if (!media) { return; }
		var fromLeft = split.classList.contains('split--rev') ? !desktop : desktop;
		gsap.set(media, { clipPath: fromLeft ? 'inset(0% 0% 0% 100% round 12px)' : 'inset(0% 100% 0% 0% round 12px)' });
		onView(split, 'top 78%', function () {
			gsap.to(media, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' });
			gsap.fromTo($$('.ticks li, .btn', split), { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.07, delay: 0.4, ease: 'power3.out', clearProps: 'transform' });
		});
	});

	// Process steps light up in order.
	$$('.process li').forEach(function (li, i) {
		gsap.from(li, { opacity: 0, y: 24, duration: 0.8, delay: i * 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.process', start: 'top 85%', once: true } });
	});

	// Packages rise from the centre out; the featured badge drops in last.
	var plans = $$('.plan');
	if (plans.length) {
		gsap.set(plans, { opacity: 0, y: 90 });
		gsap.set('.cover li', { opacity: 0, scale: 0.6 });
		onView('.plans', 'top 85%', function () {
			gsap.timeline()
				.to('.cover li', { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(2.4)' }, 0)
				.to(plans, { opacity: 1, y: 0, duration: 1.1, stagger: { each: 0.12, from: 'center' }, ease: 'expo.out', clearProps: 'transform' }, 0.2)
				.from('.plan__badge', { opacity: 0, y: -10, duration: 0.5 }, 0.9);
		});
	}

	// Offer cars drive in like the homepage's new arrivals.
	if (offerGrid) {
		var cars = $$('.car', offerGrid);
		gsap.set(cars, { opacity: 0 });
		onView(offerGrid, 'top 85%', function () {
			cars.forEach(function (el, i) {
				gsap.fromTo(el, { x: i % 2 ? -100 : 100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, delay: Math.floor(i / 2) * 0.12, ease: 'expo.out', clearProps: 'transform' });
			});
		});
	}

	// Forms and the calculator tilt up into place.
	$$('.form-card, .calc').forEach(function (card) {
		gsap.fromTo(card, { opacity: 0, y: 60, rotation: -1.5 }, { opacity: 1, y: 0, rotation: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: card, start: 'top 88%', once: true } });
	});

	// Guide/article cards: photos come into focus.
	$$('.guide-list, .guide-top').forEach(function (list) {
		var imgs = $$('.post__media img', list);
		gsap.set(imgs, { filter: 'blur(12px)', scale: 1.15 });
		onView(list, 'top 85%', function () { gsap.to(imgs, { filter: 'blur(0px)', scale: 1, duration: 1.4, stagger: 0.1, ease: 'power2.out', clearProps: 'filter,transform' }); });
	});

	// CTA band: the photo drifts while the band crosses the screen.
	$$('.cta-band img').forEach(function (img) {
		gsap.fromTo(img, { xPercent: 4, scale: 1.1 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
	});

	// Contact cards rise over the page head.
	if ($('.ways')) {
		gsap.from('.way svg', { scale: 0, rotation: -90, duration: 0.8, stagger: 0.08, delay: 0.5, ease: 'back.out(2)' });
	}
})();
