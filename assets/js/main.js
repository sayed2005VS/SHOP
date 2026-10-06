(function () {
	'use strict';

	var WA = AS.WA;
	var fmt = AS.fmt;
	var reduce = AS.reduce;
	var hasGsap = AS.hasGsap;

	var STOCK = window.STOCK || [];
	var COUNTS = window.STOCK_COUNTS || null;

	// The introduction is static so browsing starts without animated distractions.

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

	/* Soft section reveals for the homepage: each block enters as it reaches the viewport. */
	if (hasGsap) {
		document.querySelectorAll('.section:not(.section--hero)').forEach(function (section) {
			var container = section.querySelector('.container');
			if (!container || section.querySelector('.car-grid')) { return; }
			var items = Array.prototype.slice.call(container.children).filter(function (el) {
				return !el.classList.contains('section__head') && !el.classList.contains('hero-slider');
			});
			if (!items.length) { return; }
			gsap.set(items, { opacity: 0, y: 24 });
			gsap.to(items, {
				opacity: 1, y: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out', clearProps: 'transform',
				scrollTrigger: { trigger: section, start: 'top 82%', once: true }
			});
		});
		document.querySelectorAll('[data-odo]').forEach(function (counter) {
			var target = parseInt(counter.textContent, 10) || 0;
			var state = { value: 0 };
			counter.textContent = '0';
			gsap.to(state, {
				value: target, duration: 1.5, ease: 'power2.out',
				scrollTrigger: { trigger: counter.closest('.stats'), start: 'top 86%', once: true },
				onUpdate: function () { counter.textContent = Math.round(state.value); }
			});
		});
		document.querySelectorAll('.steps').forEach(function (steps) {
			var items = Array.prototype.slice.call(steps.children);
			gsap.set(items, { opacity: 0, y: 18 });
			var timeline = gsap.timeline({ paused: true });
			items.forEach(function (item, index) {
				timeline.to(item, {
					opacity: 1, y: 0, duration: 0.45, ease: 'power3.out',
					onStart: function () { item.classList.add('is-done'); }
				}, index * 0.35);
			});
			ScrollTrigger.create({ trigger: steps, start: 'top 82%', once: true, onEnter: function () { timeline.play(); } });
		});
	}
	if (!hasGsap && 'IntersectionObserver' in window) {
		var revealObserver = new IntersectionObserver(function (entries, observer) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) { return; }
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
		document.querySelectorAll('.section:not(.section--hero) .container').forEach(function (el) {
			revealObserver.observe(el);
		});
		document.querySelectorAll('.stats [data-odo]').forEach(function (counter) {
			var target = parseInt(counter.textContent, 10) || 0;
			counter.textContent = '0';
			var box = counter.closest('.stats');
			var observer = new IntersectionObserver(function (entries, io) {
				if (!entries[0].isIntersecting) { return; }
				var start = performance.now();
				function tick(now) {
					var progress = Math.min(1, (now - start) / 1500);
					counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
					if (progress < 1) { requestAnimationFrame(tick); }
				}
				requestAnimationFrame(tick); io.disconnect();
			}, { threshold: 0.35 });
			observer.observe(box);
		});
		document.querySelectorAll('.steps').forEach(function (steps) {
			var observer = new IntersectionObserver(function (entries, io) {
				if (!entries[0].isIntersecting) { return; }
				Array.prototype.forEach.call(steps.children, function (item, index) {
					item.style.setProperty('--step-delay', (index * 0.35) + 's');
					item.classList.add('is-visible', 'is-done');
				});
				io.disconnect();
			}, { threshold: 0.2 });
			observer.observe(steps);
		});
	}


})();
