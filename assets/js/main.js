(function () {
	'use strict';

	var WA = AS.WA;
	var fmt = AS.fmt;
	var reduce = AS.reduce;
	var hasGsap = AS.hasGsap;

	var STOCK = window.STOCK || [];
	var COUNTS = window.STOCK_COUNTS || null;

	/* ---------- Hero slider: right-to-left wipe with a slight push ---------- */
	var hero = document.querySelector('.hero');
	var slides = hero.querySelectorAll('.hero__slide');
	var lines = hero.querySelectorAll('.hero__line');
	var dots = hero.querySelectorAll('.hero__progress button');
	var current = 0;
	var timer = null;
	var DURATION = 6500;

	function setDots(i) {
		dots.forEach(function (d, k) {
			d.classList.remove('is-active');
			d.setAttribute('aria-selected', String(k === i));
		});
		void dots[i].offsetWidth; // restart the fill animation
		dots[i].classList.add('is-active');
	}

	function swapLine(from, to) {
		var prev = lines[from];
		prev.classList.remove('is-active');
		prev.classList.add('is-leaving');
		setTimeout(function () { prev.classList.remove('is-leaving'); }, 650);
		lines[to].classList.add('is-active');
	}

	// State (classes, dots, text) changes immediately; the wipe is only visual.
	// A new change first jumps any running wipe to its end, so slides never get stuck.
	var wipe = null;
	var drift = null;
	function go(i) {
		if (i === current) { return; }
		if (wipe) { wipe.progress(1).kill(); wipe = null; }
		var from = current;
		var outSlide = slides[from];
		var inSlide = slides[i];
		current = i;
		setDots(i);
		swapLine(from, i);
		outSlide.classList.remove('is-active');
		inSlide.classList.add('is-active');
		if (!hasGsap) { return; }

		var outImg = outSlide.querySelector('img');
		var inImg = inSlide.querySelector('img');
		if (drift) { drift.kill(); }
		// Keep the outgoing slide visible underneath until the new one has fully wiped in.
		gsap.set(outSlide, { zIndex: 1, clipPath: 'inset(0% 0% 0% 0%)' });
		gsap.set(inSlide, { zIndex: 2, clipPath: 'inset(0% 0% 0% 100%)' });
		wipe = gsap.timeline({
			onComplete: function () {
				gsap.set(outSlide, { zIndex: 0, clearProps: 'clipPath' });
				gsap.set(outImg, { xPercent: 0, scale: 1.04 });
				drift = gsap.to(inImg, { scale: 1, duration: DURATION / 1000, ease: 'none' });
				wipe = null;
			}
		})
			.to(inSlide, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power3.inOut' }, 0)
			.fromTo(inImg, { scale: 1.14, xPercent: 6 }, { scale: 1.04, xPercent: 0, duration: 1.4, ease: 'power3.out' }, 0)
			.to(outImg, { xPercent: -8, duration: 1.25, ease: 'power3.inOut' }, 0);
	}
	function next() { go((current + 1) % slides.length); }
	function start() { if (!reduce) { stop(); timer = setInterval(next, DURATION); } }
	function stop() { clearInterval(timer); }

	dots.forEach(function (d, i) {
		d.addEventListener('click', function () { go(i); start(); });
	});
	document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });
	if (hasGsap) {
		gsap.set(slides[0], { zIndex: 2 });
		drift = gsap.fromTo(slides[0].querySelector('img'), { scale: 1.1 }, { scale: 1, duration: 9, ease: 'none' });
	}
	start();

	/* ---------- Search: cash / finance toggle ---------- */
	var budgetOptions = {
		cash: [['', 'أي ميزانية'], ['0-80000', 'أقل من 80,000 ريال'], ['80000-120000', '80,000 – 120,000 ريال'], ['120000-200000', '120,000 – 200,000 ريال'], ['200000-', 'أكثر من 200,000 ريال']],
		finance: [['', 'أي قسط'], ['m0-1500', 'أقل من 1,500 ريال'], ['m1500-2500', '1,500 – 2,500 ريال'], ['m2500-4000', '2,500 – 4,000 ريال'], ['m4000-', 'أكثر من 4,000 ريال']]
	};
	var seg = document.querySelector('.seg');
	var segBtns = seg.querySelectorAll('.seg__btn');
	segBtns.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var pay = btn.dataset.pay;
			seg.dataset.pay = pay;
			segBtns.forEach(function (b) {
				b.classList.toggle('is-active', b === btn);
				b.setAttribute('aria-selected', String(b === btn));
			});
			document.getElementById('pay').value = pay;
			document.getElementById('budget-label').textContent = pay === 'cash' ? 'الميزانية' : 'القسط الشهري';
			document.getElementById('budget').innerHTML = budgetOptions[pay].map(function (o, i) {
				return '<option value="' + o[0] + '">' + o[1] + '</option>';
			}).join('');
		});
	});

	/* ---------- Live stock counts ---------- */
	var carsLabel = AS.carsLabel;
	if (COUNTS) {
		document.querySelectorAll('[data-total]').forEach(function (el) { el.textContent = COUNTS.total; });
		document.querySelectorAll('[data-body]').forEach(function (el) {
			var n = COUNTS.body && COUNTS.body[el.dataset.body];
			if (n) { el.textContent = carsLabel(n); }
		});
		document.querySelectorAll('[data-fuel]').forEach(function (el) {
			var n = COUNTS.fuel && COUNTS.fuel[el.dataset.fuel];
			if (n) { el.textContent = carsLabel(n); }
		});
	}
	document.querySelectorAll('[data-n]').forEach(function (el) { el.textContent = carsLabel(+el.dataset.n); });

	/* ---------- New arrivals: image-led cards ---------- */
	// Cleanest full-bleed photos from the newest stock lead the grid.
	var FEATURED = ['03', '27', '01', '13', '36', '02'];
	// 24: listing reuses a K8 photo · 20: photographer's shadow · 35: another dealer's sign.
	var EXCLUDE = ['24', '20', '35'];
	var GROUPS = { nissan: ['nissan', 'infiniti'] };
	var BRAND_NAMES = { hyundai: 'هيونداي', toyota: 'تويوتا', nissan: 'نيسان وإنفينيتي', ford: 'فورد', kia: 'كيا' };
	var PER_VIEW = 6;
	var grid = document.getElementById('cars');
	STOCK = STOCK.filter(function (c) { return EXCLUDE.indexOf(c.id) === -1; });
	STOCK.forEach(function (c, i) {
		var f = FEATURED.indexOf(c.id);
		c.rank = f === -1 ? 100 + i : f;
	});
	STOCK.sort(function (a, b) { return a.rank - b.rank; });

	var card = AS.carCard;

	function pick(filter) {
		if (filter === 'all') { return STOCK.slice(0, PER_VIEW); }
		var brands = GROUPS[filter] || [filter];
		return STOCK.filter(function (c) { return brands.indexOf(c.brand) !== -1; }).slice(0, PER_VIEW);
	}

	// Odd number of cars → the last slot becomes a "see all from this brand" tile.
	function moreCard(filter) {
		var brands = GROUPS[filter] || [filter];
		var total = brands.reduce(function (sum, b) { return sum + ((COUNTS && COUNTS.brands[b]) || 0); }, 0);
		return '<a class="car car--more" href="cars.html?brand=' + (GROUPS[filter] || [filter]).join(',') + '">' +
			'<span class="car--more__count">' + total + '</span>' +
			'<span class="car--more__label">سيارة ' + BRAND_NAMES[filter] + ' في المعرض</span>' +
			'<span class="btn btn--light">شاهد الكل</span>' +
		'</a>';
	}

	function html(filter) {
		var list = pick(filter);
		var out = list.map(card).join('');
		if (filter !== 'all' && list.length % 2 === 1) { out += moreCard(filter); }
		return out;
	}

	// Cards "drive in" from the side of their own column, then a showroom light sweeps across.
	function driveIn(cards) {
		var mid = grid.getBoundingClientRect().left + grid.offsetWidth / 2;
		var single = grid.offsetWidth < 700;
		cards.forEach(function (el, i) {
			var r = el.getBoundingClientRect();
			var fromRight = single ? true : (r.left + r.width / 2 > mid);
			var dist = single ? 70 : 140;
			gsap.fromTo(el, { x: fromRight ? dist : -dist, opacity: 0 }, {
				x: 0, opacity: 1, duration: 1.15, delay: (i % 2) * 0.12, ease: 'expo.out', clearProps: 'transform'
			});
			var sheen = el.querySelector('.car__sheen');
			if (sheen) {
				gsap.fromTo(sheen, { xPercent: 130 }, { xPercent: -130, duration: 1.2, delay: 0.45 + (i % 2) * 0.12, ease: 'power2.inOut' });
			}
		});
	}

	function bindCars() {
		if (!hasGsap) { return; }
		var cards = grid.querySelectorAll('.car');
		gsap.set(cards, { opacity: 0 });
		ScrollTrigger.batch(cards, { start: 'top 88%', once: true, onEnter: driveIn });
	}

	function render(filter) {
		if (!hasGsap) { grid.innerHTML = html(filter); return; }
		gsap.to(grid.children, {
			opacity: 0, y: 12, duration: 0.22, stagger: 0.03, ease: 'power1.in',
			onComplete: function () {
				grid.innerHTML = html(filter);
				ScrollTrigger.refresh();
				driveIn(Array.prototype.slice.call(grid.children));
			}
		});
	}

	var chips = document.querySelectorAll('.chip');
	chips.forEach(function (chip) {
		chip.addEventListener('click', function () {
			if (chip.classList.contains('is-active')) { return; }
			chips.forEach(function (c) {
				c.classList.toggle('is-active', c === chip);
				c.setAttribute('aria-selected', String(c === chip));
			});
			render(chip.dataset.filter);
		});
	});
	if (STOCK.length) { grid.innerHTML = html('all'); }

	/* ---------- Installment calculator ---------- */
	var RATE = 0.045; // flat annual profit rate, indicative only
	var price = document.getElementById('price');
	var down = document.getElementById('down');
	var terms = document.querySelectorAll('input[name="term"]');
	var out = document.getElementById('o-monthly');
	var shown = { v: 0 };

	function fill(el) {
		var pct = (el.value - el.min) / (el.max - el.min) * 100;
		el.style.setProperty('--fill', pct + '%');
	}
	function calc() {
		var p = +price.value;
		var d = p * (+down.value / 100);
		var m = +document.querySelector('input[name="term"]:checked').value;
		var financed = p - d;
		var monthly = Math.round((financed + financed * RATE * (m / 12)) / m);
		document.getElementById('o-price').textContent = fmt.format(p) + ' ريال';
		document.getElementById('o-down').textContent = down.value + '% (' + fmt.format(Math.round(d)) + ' ريال)';
		fill(price); fill(down);
		if (hasGsap) {
			gsap.to(shown, { v: monthly, duration: 0.45, ease: 'power2.out', onUpdate: function () { out.textContent = fmt.format(Math.round(shown.v)) + ' ريال'; } });
		} else {
			out.textContent = fmt.format(monthly) + ' ريال';
		}
	}
	[price, down].forEach(function (el) { el.addEventListener('input', calc); });
	terms.forEach(function (el) { el.addEventListener('change', calc); });
	calc();

	/* ---------- Bank logos marquee: duplicate for a seamless loop ---------- */
	var track = document.querySelector('.marquee__track');
	if (track) {
		Array.prototype.slice.call(track.children).forEach(function (li) {
			var copy = li.cloneNode(true);
			copy.setAttribute('aria-hidden', 'true');
			copy.querySelector('img').alt = '';
			track.appendChild(copy);
		});
	}

	/* ---------- Reviews carousel: arrow buttons step one card ---------- */
	var revTrack = document.getElementById('reviews-track');
	var revBtns = document.querySelectorAll('.reviews__btn');
	function revStep() {
		var first = revTrack.children[0];
		return first.offsetWidth + parseFloat(getComputedStyle(revTrack).columnGap || 0);
	}
	// RTL: "next" moves toward negative scrollLeft.
	function revUpdate() {
		var max = revTrack.scrollWidth - revTrack.clientWidth;
		var pos = Math.abs(revTrack.scrollLeft);
		revBtns[0].disabled = pos < 4;
		revBtns[1].disabled = pos > max - 4;
	}
	revBtns.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var dir = btn.dataset.dir === 'next' ? -1 : 1;
			revTrack.scrollBy({ left: dir * revStep(), behavior: reduce ? 'auto' : 'smooth' });
		});
	});
	revTrack.addEventListener('scroll', revUpdate, { passive: true });
	window.addEventListener('resize', revUpdate);
	revUpdate();

	/* ==========================================================================
	   Motion — every section has its own entrance, tied to what it shows.
	   ========================================================================== */
	if (!hasGsap) { return; }

	var mm = gsap.matchMedia();
	var isDesktop = window.matchMedia('(min-width: 1081px)').matches;
	var onView = AS.onView;

	AS.revealHeadings();

	/* Hero: showroom lights come on, the headline rises word by word. */
	gsap.timeline({ defaults: { ease: 'power3.out' } })
		.fromTo('.hero__slides', { filter: 'brightness(0.2)', scale: 1.05 }, { filter: 'brightness(1)', scale: 1, duration: 2.4, ease: 'power2.out', clearProps: 'filter' }, 0)
		.from('.hero__eyebrow', { opacity: 0, duration: 0.9 }, 0.35)
		.from('.hero__title .w > span', { yPercent: 115, duration: 1.15, stagger: 0.09, ease: 'power4.out' }, 0.45)
		.from('.hero__rotator', { opacity: 0, duration: 0.8 }, 1.05)
		.from('.hero__ctas .btn', { opacity: 0, y: 14, duration: 0.8, stagger: 0.08 }, 1.15)
		.from('.search', { y: 56, opacity: 0, duration: 1.1 }, 1.0)
		.from('.search .field, .search__submit', { opacity: 0, y: 10, duration: 0.6, stagger: 0.06 }, 1.35)
		.from('.hero__progress', { opacity: 0, duration: 0.6 }, 1.5);

	// Hero copy drifts back as the page moves on.
	gsap.to('.hero__content', {
		yPercent: -12, opacity: 0.35, ease: 'none',
		scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
	});

	/* Brands: tiles open out from the centre, then an "ignition check" —
	   every logo lights up in turn like a dashboard at start-up, then settles. */
	var brandList = document.querySelector('.brands');
	var brandTiles = brandList.querySelectorAll('li');
	var brandImgs = brandList.querySelectorAll('img');
	gsap.set(brandTiles, { opacity: 0, scale: 0.86 });
	onView(brandList, 'top 82%', function () {
		brandList.classList.add('is-igniting');
		gsap.timeline({
			onComplete: function () {
				gsap.set(brandImgs, { clearProps: 'filter,opacity' });
				gsap.set(brandTiles, { clearProps: 'transform' });
				brandList.classList.remove('is-igniting');
			}
		})
			.to(brandTiles, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)', stagger: { each: 0.035, grid: 'auto', from: 'center' } }, 0)
			.to(brandImgs, { filter: 'grayscale(0)', opacity: 1, duration: 0.2, stagger: 0.04, ease: 'power1.out' }, 0.55)
			.to(brandImgs, { filter: 'grayscale(1)', opacity: 0.7, duration: 0.9, stagger: 0.04, ease: 'power2.inOut' }, 1.05);
	});

	/* Body types: covers pulled off — each photo is unveiled from the bottom. */
	var typeTiles = gsap.utils.toArray('.type');
	gsap.set(typeTiles, { clipPath: 'inset(100% 0% 0% 0% round 12px)' });
	gsap.set('.type__body', { opacity: 0, y: 14 });
	onView('.types', 'top 78%', function () {
		gsap.timeline()
			.to(typeTiles, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.25, stagger: 0.11, ease: 'power4.inOut' }, 0)
			.fromTo('.type img', { scale: 1.35 }, { scale: 1, duration: 1.7, stagger: 0.11, ease: 'power3.out' }, 0.1)
			.to('.type__body', { opacity: 1, y: 0, duration: 0.7, stagger: 0.11, ease: 'power3.out' }, 0.85)
			.set(typeTiles, { clearProps: 'clipPath' });
	});
	gsap.set('.budget > *', { opacity: 0, y: 12 });
	onView('.budget', 'top 92%', function () {
		gsap.to('.budget > *', { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' });
	});
	// The photo leans toward the pointer.
	if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
		typeTiles.forEach(function (tile) {
			var img = tile.querySelector('img');
			var xTo = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3.out' });
			var yTo = gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3.out' });
			tile.addEventListener('pointermove', function (e) {
				var r = tile.getBoundingClientRect();
				xTo(((e.clientX - r.left) / r.width - 0.5) * -18);
				yTo(((e.clientY - r.top) / r.height - 0.5) * -14);
			});
			tile.addEventListener('pointerenter', function () { gsap.to(img, { scale: 1.06, duration: 0.8, ease: 'power3.out' }); });
			tile.addEventListener('pointerleave', function () {
				xTo(0); yTo(0);
				gsap.to(img, { scale: 1, duration: 0.8, ease: 'power3.out' });
			});
		});
	}

	/* Offers: the campaign banner wipes open in the reading direction;
	   the two promo cards slide in from the far side. */
	var offerMain = document.querySelector('.offer--main');
	var offerSides = document.querySelectorAll('.offer--side');
	gsap.set(offerMain, { clipPath: 'inset(0% 0% 0% 100% round 12px)' });
	gsap.set(offerSides, { opacity: 0, x: isDesktop ? -70 : 0, y: isDesktop ? 0 : 40 });
	onView('.offers', 'top 78%', function () {
		gsap.timeline()
			.to(offerMain, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.4, ease: 'expo.inOut' }, 0)
			.from(offerMain.querySelector('.offer__body'), { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out' }, 1.0)
			.to(offerSides, { opacity: 1, x: 0, y: 0, duration: 1.1, stagger: 0.14, ease: 'expo.out' }, 0.45)
			.from('.offer__big', { opacity: 0, scale: 0.6, transformOrigin: '100% 50%', duration: 0.8, stagger: 0.14, ease: 'back.out(2)' }, 0.75)
			.set(offerMain, { clearProps: 'clipPath' });
	});

	/* New arrivals: cards drive in from their own side; a light sweeps the photo. */
	bindCars();

	/* Depth: big photos move a touch slower than the page. */
	gsap.utils.toArray('[data-parallax-img]').forEach(function (img) {
		gsap.fromTo(img, { yPercent: -5 }, {
			yPercent: 5, ease: 'none',
			scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
		});
	});

	/* Why us: the showroom photo rises into frame, reasons slide in, stats roll like an odometer. */
	var whyMedia = document.querySelector('.why__media');
	gsap.set(whyMedia, { clipPath: 'inset(100% 0% 0% 0% round 12px)' });
	gsap.set('.why__item', { opacity: 0, x: isDesktop ? -40 : 0, y: isDesktop ? 0 : 24 });
	gsap.set('.why__item svg', { scale: 0, rotation: -90 });
	gsap.set('.why__stamp', { opacity: 0, y: 12 });
	onView('.why', 'top 70%', function () {
		gsap.timeline()
			.to(whyMedia, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.4, ease: 'power4.inOut' }, 0)
			.to('.why__stamp', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 1.1)
			.to('.why__item', { opacity: 1, x: 0, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.35)
			.to('.why__item svg', { scale: 1, rotation: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(2.2)' }, 0.45)
			.set(whyMedia, { clearProps: 'clipPath' });
	});
	document.querySelectorAll('[data-odo]').forEach(function (el) {
		var value = el.textContent.trim();
		el.setAttribute('aria-label', value);
		el.innerHTML = value.split('').map(function (ch, i, arr) {
			var isLast = i === arr.length - 1;
			var digits = '';
			for (var k = 0; k < (isLast ? 20 : 10); k++) { digits += '<span>' + (k % 10) + '</span>'; }
			return '<span class="odo" aria-hidden="true"><span class="odo__strip" data-to="' + (isLast ? 10 + (+ch) : +ch) + '">' + digits + '</span></span>';
		}).join('');
	});
	onView('.stats', 'top 88%', function () {
		document.querySelectorAll('.odo__strip').forEach(function (strip, i) {
			var count = strip.children.length;
			gsap.to(strip, { yPercent: -(+strip.dataset.to / count) * 100, duration: 1.9, delay: i * 0.05, ease: 'power3.inOut' });
		});
	});

	/* Financing: the calculator tilts up into place; steps appear, then fill in order as you scroll. */
	gsap.set('.calc', { opacity: 0, y: 80, rotation: -2.5 });
	onView('.fin', 'top 75%', function () {
		gsap.to('.calc', { opacity: 1, y: 0, rotation: 0, duration: 1.3, ease: 'expo.out' });
	});
	var steps = document.querySelectorAll('.steps li');
	gsap.set(steps, { opacity: 0, x: isDesktop ? 40 : 0, y: isDesktop ? 0 : 20 });
	onView('.steps', 'top 85%', function () {
		gsap.to(steps, { opacity: 1, x: 0, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
	});
	ScrollTrigger.create({
		trigger: '.steps',
		start: 'top 70%',
		end: 'bottom 35%',
		scrub: true,
		onUpdate: function (self) {
			var done = Math.round(self.progress * steps.length);
			steps.forEach(function (li, i) { li.classList.toggle('is-done', i < done); });
		}
	});
	gsap.from('.marquee', { opacity: 0, duration: 1.2, scrollTrigger: { trigger: '.marquee', start: 'top 95%', once: true } });

	/* After-sales: benefits tick on in order. */
	gsap.set('.perks li', { opacity: 0, y: 10 });
	onView('.perks', 'top 95%', function () {
		gsap.to('.perks li', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
	});

	/* After-sales photos: each opens from its outer edge toward the centre. */
	var servCards = document.querySelectorAll(".serv-card");
	servCards.forEach(function (card, i) {
		gsap.set(card, { clipPath: i === 0 ? "inset(0% 0% 0% 100% round 12px)" : "inset(0% 100% 0% 0% round 12px)" });
	});
	onView(".serv-gallery", "top 85%", function () {
		gsap.timeline()
			.to(servCards, { clipPath: "inset(0% 0% 0% 0% round 12px)", duration: 1.3, stagger: 0.12, ease: "expo.inOut" })
			.from(".serv-card figcaption", { opacity: 0, y: 16, duration: 0.7, stagger: 0.12, ease: "power3.out" }, 0.8)
			.set(servCards, { clearProps: "clipPath" });
	});

	/* Corporate: the photo slides out along its diagonal edge; the points follow. */
	mm.add('(min-width: 1081px)', function () {
		gsap.fromTo('.corp__media img',
			{ clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)' },
			{
				clipPath: 'polygon(0% 0%, 88% 0%, 100% 100%, 0% 100%)', duration: 1.5, ease: 'expo.inOut',
				scrollTrigger: { trigger: '.corp', start: 'top 72%', once: true }
			});
	});
	mm.add('(max-width: 1080px)', function () {
		gsap.fromTo('.corp__media img',
			{ clipPath: 'inset(0% 0% 100% 0%)' },
			{ clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: '.corp', start: 'top 80%', once: true } });
	});
	gsap.set('.corp__points li, .corp__actions .btn', { opacity: 0, x: isDesktop ? 30 : 0, y: isDesktop ? 0 : 14 });
	onView('.corp', 'top 72%', function () {
		gsap.to('.corp__points li, .corp__actions .btn', { opacity: 1, x: 0, y: 0, duration: 0.8, stagger: 0.08, delay: 0.5, ease: 'power3.out' });
	});

	/* Reviews: cards flip up like turned-over notes, then the stars light up one by one. */
	var reviews = document.querySelectorAll('.review');
	gsap.set(reviews, { opacity: 0, rotationX: -70, transformOrigin: '50% 100%' });
	gsap.set('.review__stars i', { scale: 0 });
	onView('.reviews__track', 'top 82%', function () {
		gsap.timeline()
			.to(reviews, { opacity: 1, rotationX: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', clearProps: 'transform' }, 0)
			.to('.review__stars i', { scale: 1, duration: 0.35, stagger: 0.04, ease: 'back.out(3)' }, 0.5);
	});

	/* Car guide: photos come into focus like a camera lens; the text follows. */
	var postImgs = document.querySelectorAll('.post__media img');
	gsap.set('.post', { opacity: 0, y: 40 });
	gsap.set(postImgs, { filter: 'blur(14px)', scale: 1.18 });
	gsap.set('.post__body > *', { opacity: 0, y: 10 });
	onView('.guide__grid', 'top 80%', function () {
		gsap.timeline()
			.to('.post', { opacity: 1, y: 0, duration: 1, stagger: 0.14, ease: 'power3.out', clearProps: 'transform' }, 0)
			.to(postImgs, { filter: 'blur(0px)', scale: 1, duration: 1.6, stagger: 0.14, ease: 'power2.out', clearProps: 'filter,transform' }, 0.1)
			.to('.post__body > *', { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.6);
	});

	/* Visit: the info card slides over the map like a pinned location card. */
	gsap.set('.visit__card', { opacity: 0, x: isDesktop ? 90 : 0, y: isDesktop ? 0 : 40 });
	onView('.visit', 'top 90%', function () {
		gsap.to('.visit__card', { opacity: 1, x: 0, y: 0, duration: 1.2, ease: 'expo.out' });
	});
})();
