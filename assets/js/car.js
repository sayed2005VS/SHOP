/* Single car page: car.html?id=NN — renders assets/data/cars/NN.js into the template. */
(function () {
	'use strict';

	var AS = window.AS;
	var fmt = AS.fmt;
	var hasGsap = AS.hasGsap;
	var STOCK = window.STOCK || [];
	var INDEX = window.CAR_INDEX || {};

	var BRANDS = {
		hyundai: 'هيونداي', toyota: 'تويوتا', nissan: 'نيسان', ford: 'فورد', kia: 'كيا', mg: 'ام جي',
		infiniti: 'إنفينيتي', isuzu: 'إيسوزو', geely: 'جيلي', chery: 'شيري', foton: 'فوتون', honda: 'هوندا',
		byd: 'بي واي دي', ram: 'رام', jetour: 'جيتور', chevrolet: 'شيفروليه'
	};
	var GROUPS = [
		{ key: 'engine', title: 'المحرك والأداء' },
		{ key: 'capacity', title: 'الأبعاد والسعة' },
		{ key: 'safety', title: 'الأمان' },
		{ key: 'comfort', title: 'الراحة والترفيه' },
		{ key: 'exterior', title: 'الشكل الخارجي' }
	];
	var ICONS = {
		year: '<path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM5 9h14v11H5z"/>',
		engine: '<path d="M7 4v2h3v2H7l-2 2v3H3v-3H1v8h2v-3h2v3h3l2 2h8v-4h2v3h3V9h-3v3h-2V8h-6V6h3V4z"/>',
		cylinders: '<path d="M6 3h4v4H6zm8 0h4v4h-4zM5 9h6v12H5zm8 0h6v12h-6z"/>',
		turbo: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4l1.5 4.5H18l-3.7 2.7 1.4 4.5L12 15l-3.7 2.7 1.4-4.5L6 10.5h4.5z"/>',
		seats: '<path d="M7 3a2 2 0 1 0 0 .01zM5 7h4l2 6h5a2 2 0 0 1 2 2v5h-2v-4h-6l-3-1-2-6zm-2 6h2v7H3z"/>',
		power: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
		torque: '<path d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V2l4 3-4 3z"/>',
		transmission: '<path d="M5 3a2 2 0 0 1 1 3.7V11h5V6.7a2 2 0 1 1 2 0V11h5V6.7a2 2 0 1 1 2 0V13h-7v4.3a2 2 0 1 1-2 0V13H6v4.3a2 2 0 1 1-2 0V6.7A2 2 0 0 1 5 3z"/>',
		gearbox: '<path d="M5 3a2 2 0 0 1 1 3.7V11h5V6.7a2 2 0 1 1 2 0V11h5V6.7a2 2 0 1 1 2 0V13h-7v4.3a2 2 0 1 1-2 0V13H6v4.3a2 2 0 1 1-2 0V6.7A2 2 0 0 1 5 3z"/>',
		fuel: '<path d="M4 3h9v8h1a2 2 0 0 1 2 2v4a1 1 0 0 0 2 0V9l-3-3 1.4-1.4L21 9.2V17a3 3 0 0 1-6 0v-4h-2v8H4zm2 2v4h5V5z"/>',
		drive: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a7 7 0 0 1 6.9 6h-3.1A4 4 0 0 0 13 8.2V5.1A7 7 0 0 1 12 5zm-1 .1v3.1A4 4 0 0 0 8.2 11H5.1A7 7 0 0 1 11 5.1zM5.1 13h3.1a4 4 0 0 0 2.8 2.8v3.1A7 7 0 0 1 5.1 13zm7.9 5.9v-3.1a4 4 0 0 0 2.8-2.8h3.1a7 7 0 0 1-5.9 5.9z"/>',
		body: '<path d="M18.9 6a1.5 1.5 0 0 0-1.4-1H6.5a1.5 1.5 0 0 0-1.4 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8zM5 11l1.5-4.5h11L19 11z"/>',
		battery: '<path d="M7 4h3V2h4v2h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm6 4l-4 6h3l-1 4 4-6h-3z"/>',
		range: '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/>'
	};
	function icon(key) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[key] || ICONS.body) + '</svg>'; }
	function $(sel, root) { return (root || document).querySelector(sel); }
	function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

	var params = new URLSearchParams(location.search);
	var id = (params.get('id') || '03').replace(/\D/g, '').padStart(2, '0');
	var stockItem = STOCK.find(function (c) { return c.id === id; });

	// Load the car's data file with a <script> tag so the page also works when opened from disk.
	var s = document.createElement('script');
	s.src = 'assets/data/cars/' + id + '.js';
	s.onload = function () { render(window.CAR_DETAIL); };
	s.onerror = function () { render(null); };
	document.body.appendChild(s);

	var car;
	var color = '';

	function waLink(extra) {
		var msg = 'مرحبًا، أرغب في الاستفسار عن ' + car.name + (color ? ' – اللون: ' + color : '') + (extra || '');
		return AS.WA + encodeURIComponent(msg);
	}
	function refreshWa() { $$('[data-wa]').forEach(function (a) { a.href = waLink(); }); }

	function render(d) {
		if (!d && !stockItem) {
			$('[data-name]').textContent = 'السيارة غير موجودة';
			return;
		}
		car = d || {
			id: id, name: stockItem.name, brand: stockItem.brand, body: stockItem.body, gearbox: stockItem.gearbox,
			fuel: stockItem.fuel, drive: stockItem.drive, price: stockItem.price || null, colors: [], quick: [], groups: {},
			images: [{ src: stockItem.img, thumb: stockItem.img, w: stockItem.w, h: stockItem.h, kind: 'ext' }], description: ''
		};
		// Fall back to the catalog's (demo) price so the page matches the listing.
		if (!car.price && stockItem && stockItem.price) { car.price = stockItem.price; }
		car.brandName = BRANDS[car.brand] || '';
		var year = (car.name.match(/20\d\d/) || [''])[0];

		document.title = car.name + ' | شركة عبد السلام للسيارات';
		$('[data-name]').textContent = car.name;
		$('[data-crumb-name]').textContent = car.name;
		var crumbBrand = $('[data-crumb-brand]');
		crumbBrand.textContent = car.brandName || 'الماركات';
		crumbBrand.href = 'cars.html?brand=' + car.brand;

		// Meta chips
		$('[data-meta]').innerHTML = [car.body, car.gearbox, car.fuel, car.drive].filter(Boolean)
			.map(function (t) { return '<li>' + AS.esc(t) + '</li>'; }).join('');

		renderPrice(year);
		renderColors();
		renderGallery();
		renderQuick(year);
		renderSpecs();
		renderTrims();
		renderSimilar();
		setupCalc();
		setupRequest();
		setupBuybar();
		refreshWa();
		motion();
	}

	/* ---------- Price ---------- */
	function renderPrice() {
		var box = $('[data-price]');
		var bar = $('[data-buybar-price]');
		if (car.price) {
			var m = AS.monthly(car.price);
			box.innerHTML =
				'<div class="buy__amount"><strong>' + fmt.format(car.price) + '</strong> <span>ريال</span></div>' +
				'<p class="buy__sub">كاش شامل ضريبة القيمة المضافة</p>' +
				'<div class="buy__monthly">أو قسط تقريبي من <strong>' + fmt.format(m) + ' ريال</strong> شهريًا<small>دفعة أولى 10% على 5 سنوات، والقسط النهائي حسب جهة التمويل</small></div>';
			bar.innerHTML = '<small>كاش</small><strong>' + fmt.format(car.price) + ' ريال</strong>';
		} else {
			box.innerHTML =
				'<div class="buy__amount buy__amount--ask"><strong>السعر عند الطلب</strong></div>' +
				'<p class="buy__sub">أرسل طلبك ونرسل لك أفضل سعر كاش أو تقسيط مع 11 جهة تمويل.</p>';
			bar.innerHTML = '<small>' + AS.esc(car.name) + '</small><strong>السعر عند الطلب</strong>';
		}
	}

	/* ---------- Colors ---------- */
	function renderColors() {
		var wrap = $('[data-colors-wrap]');
		var list = $('[data-colors]');
		if (!car.colors || !car.colors.length) { wrap.hidden = true; return; }
		list.innerHTML = car.colors.map(function (c, i) {
			return '<button type="button" role="radio" class="swatch' + (i === 0 ? ' is-active' : '') + '" aria-checked="' + (i === 0) + '" aria-label="' + AS.esc(c.name) + '" title="' + AS.esc(c.name) + '" style="--swatch:' + AS.esc(c.hex) + '" data-color="' + AS.esc(c.name) + '"></button>';
		}).join('');
		color = car.colors[0].name;
		$('[data-color-name]').textContent = color;
		$$('.swatch', list).forEach(function (b) {
			b.addEventListener('click', function () {
				$$('.swatch', list).forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', String(x === b)); });
				color = b.dataset.color;
				$('[data-color-name]').textContent = color;
				refreshWa();
			});
		});
	}

	/* ---------- Gallery + lightbox ---------- */
	var shots = [];
	var view = [];
	var at = 0;
	var tab = 'ext';
	function renderGallery() {
		shots = (car.images || []).map(function (im, i) { im.n = i; return im; });
		var ext = shots.filter(function (s) { return s.kind === 'ext'; });
		var int = shots.filter(function (s) { return s.kind === 'int'; });
		$('[data-count-ext]').textContent = '(' + ext.length + ')';
		$('[data-count-int]').textContent = '(' + int.length + ')';
		if (!int.length || !ext.length) { $('.gallery__tabs').hidden = true; }
		tab = ext.length ? 'ext' : 'int';
		$$('[data-gallery-tab]').forEach(function (b) {
			b.addEventListener('click', function () { setTab(b.dataset.galleryTab); });
		});
		$('[data-gallery-prev]').addEventListener('click', function () { show(at - 1); });
		$('[data-gallery-next]').addEventListener('click', function () { show(at + 1); });
		var stage = $('.gallery__stage');
		stage.tabIndex = 0;
		stage.setAttribute('aria-label', 'صور ' + car.name + '، استخدم الأسهم للتنقل');
		stage.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') { show(at + 1); }
			if (e.key === 'ArrowRight') { show(at - 1); }
		});
		swipe(stage, function (dir) { show(at + dir); });
		$('[data-gallery-img]').addEventListener('click', function () { if (!stage.dataset.swiped) { openLightbox(); } });
		$('[data-gallery-open]').addEventListener('click', openLightbox);
		setTab(tab, true);
	}
	function setTab(t, first) {
		tab = t;
		view = shots.filter(function (s) { return s.kind === t; });
		if (!view.length) { view = shots; }
		$$('[data-gallery-tab]').forEach(function (b) {
			var on = b.dataset.galleryTab === t;
			b.classList.toggle('is-active', on);
			b.setAttribute('aria-selected', String(on));
		});
		$('[data-gallery-thumbs]').innerHTML = view.map(function (s, i) {
			return '<button class="thumb" role="listitem" data-i="' + i + '" aria-label="الصورة ' + (i + 1) + '"><img src="' + s.thumb + '" alt="" loading="lazy" width="240" height="180"></button>';
		}).join('');
		$$('.thumb').forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.i); }); });
		at = 0;
		show(0, first);
	}
	function show(i, instant) {
		if (!view.length) { return; }
		at = (i + view.length) % view.length;
		var img = $('[data-gallery-img]');
		var s = view[at];
		var apply = function () {
			img.src = s.src;
			img.width = s.w || 1400;
			img.height = s.h || 1050;
			img.alt = car.name + (s.kind === 'int' ? ' – من الداخل' : '') + ' – صورة ' + (at + 1);
		};
		if (hasGsap && !instant) {
			gsap.to(img, {
				opacity: 0, duration: 0.18, ease: 'power1.in',
				onComplete: function () {
					apply();
					gsap.fromTo(img, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' });
				}
			});
		} else { apply(); }
		$('[data-gallery-counter]').textContent = (at + 1) + ' / ' + view.length;
		$$('.thumb').forEach(function (b, k) {
			b.classList.toggle('is-active', k === at);
			if (k === at) { b.setAttribute('aria-current', 'true'); } else { b.removeAttribute('aria-current'); }
		});
		var active = $('.thumb.is-active');
		if (active && !instant) { active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: AS.reduce ? 'auto' : 'smooth' }); }
		if (lb && !lb.hidden) { lbShow(); }
	}
	function swipe(el, fn) {
		var x0 = null;
		el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { x0 = e.clientX; } });
		el.addEventListener('pointerup', function (e) {
			if (x0 === null) { return; }
			var dx = e.clientX - x0;
			x0 = null;
			// RTL: swiping right brings the next photo. A swipe must not also count as a tap.
			if (Math.abs(dx) > 40) {
				el.dataset.swiped = "1";
				setTimeout(function () { delete el.dataset.swiped; }, 350);
				fn(dx > 0 ? 1 : -1);
			}
		});
	}

	var lb = $('[data-lightbox]');
	var lastFocus = null;
	function lbShow() {
		var s = view[at];
		$('[data-lb-img]').src = s.src;
		$('[data-lb-img]').alt = $('[data-gallery-img]').alt;
		$('[data-lb-counter]').textContent = (at + 1) + ' / ' + view.length;
	}
	function openLightbox() {
		lastFocus = document.activeElement;
		lb.hidden = false;
		document.body.style.overflow = 'hidden';
		lbShow();
		$('[data-lb-close]').focus();
		if (hasGsap) { gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 }); }
	}
	function closeLightbox() {
		lb.hidden = true;
		document.body.style.overflow = '';
		if (lastFocus) { lastFocus.focus(); }
	}
	$('[data-lb-close]').addEventListener('click', closeLightbox);
	$('[data-lb-prev]').addEventListener('click', function () { show(at - 1, true); });
	$('[data-lb-next]').addEventListener('click', function () { show(at + 1, true); });
	lb.addEventListener('click', function (e) { if (e.target === lb) { closeLightbox(); } });
	swipe(lb, function (dir) { show(at + dir, true); });
	document.addEventListener('keydown', function (e) {
		if (lb.hidden) { return; }
		if (e.key === 'Escape') { closeLightbox(); }
		if (e.key === 'ArrowLeft') { show(at + 1, true); }
		if (e.key === 'ArrowRight') { show(at - 1, true); }
		if (e.key === 'Tab') {
			// keep focus inside the lightbox
			var f = $$('button', lb);
			var i = f.indexOf(document.activeElement);
			e.preventDefault();
			f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
		}
	});

	/* ---------- Quick look ---------- */
	function renderQuick(year) {
		var q = (car.quick || []).slice();
		var has = function (k) { return q.some(function (x) { return x.key === k; }); };
		var base = [];
		if (year) { base.push({ key: 'year', label: 'سنة الصنع', value: year }); }
		if (car.body) { base.push({ key: 'body', label: 'الفئة', value: car.body }); }
		if (!has('transmission') && car.gearbox) { base.push({ key: 'gearbox', label: 'ناقل الحركة', value: car.gearbox }); }
		if (car.fuel) { base.push({ key: 'fuel', label: 'الوقود', value: car.fuel }); }
		if (!has('drive') && car.drive) { base.push({ key: 'drive', label: 'نظام الدفع', value: car.drive }); }
		var all = base.concat(q.filter(function (x) { return x.key !== 'fuel'; }));
		$('[data-quick]').innerHTML = all.map(function (x) {
			return '<li class="quick__item">' + icon(x.key) + '<span class="quick__label">' + AS.esc(x.label) + '</span><strong class="quick__value">' + AS.esc(x.value) + '</strong></li>';
		}).join('');
	}

	/* ---------- Specs ---------- */
	function renderSpecs() {
		var groups = car.groups || {};
		var html = GROUPS.filter(function (g) { return (groups[g.key] || []).length; }).map(function (g) {
			var items = groups[g.key];
			var more = items.length > 8;
			return '<div class="spec' + (more ? ' is-collapsed' : '') + '">' +
				'<h3 class="spec__title">' + g.title + ' <span>' + items.length + '</span></h3>' +
				'<ul class="spec__list">' + items.map(function (t, i) { return '<li' + (i >= 8 ? ' class="spec__extra"' : '') + '>' + AS.esc(t) + '</li>'; }).join('') + '</ul>' +
				(more ? '<button type="button" class="spec__more" aria-expanded="false">عرض الكل (' + items.length + ')</button>' : '') +
				'</div>';
		}).join('');
		if (!html) { $('[data-specs-section]').hidden = true; return; }
		$('[data-specs]').innerHTML = html;
		$$('.spec__more').forEach(function (b) {
			b.addEventListener('click', function () {
				var box = b.closest('.spec');
				var open = box.classList.toggle('is-collapsed') === false;
				b.setAttribute('aria-expanded', String(open));
				b.textContent = open ? 'عرض أقل' : 'عرض الكل (' + box.querySelectorAll('li').length + ')';
			});
		});
		if (car.description) {
			var p = $('[data-desc]');
			p.textContent = car.description;
			p.hidden = false;
		}
	}

	/* ---------- Trims of the same model ---------- */
	function renderTrims() {
		var mine = INDEX[car.id];
		if (!mine) { return; }
		var trims = STOCK.filter(function (c) { return c.id !== car.id && INDEX[c.id] && INDEX[c.id].m === mine.m; });
		if (!trims.length) { return; }
		var list = [{ c: STOCK.find(function (x) { return x.id === car.id; }) || stockItem, self: true }]
			.concat(trims.map(function (c) { return { c: c, self: false }; }));
		$('[data-trims]').innerHTML = list.map(function (t) {
			var info = INDEX[t.c.id] || {};
			var label = info.t || t.c.name;
			var inner = '<img src="' + t.c.img + '" alt="" loading="lazy" width="160" height="120">' +
				'<span class="trim__body"><strong>' + AS.esc(label) + '</strong><small>' + AS.esc(info.n || t.c.name) + '</small></span>' +
				'<span class="trim__price">' + (t.c.price ? fmt.format(t.c.price) + ' ريال' : 'السعر عند الطلب') + '</span>';
			return '<li>' + (t.self
				? '<div class="trim is-current" aria-current="true">' + inner + '<span class="trim__tag">هذه الفئة</span></div>'
				: '<a class="trim" href="' + AS.carUrl(t.c.id) + '">' + inner + '</a>') + '</li>';
		}).join('');
		$('[data-trims-section]').hidden = false;
	}

	/* ---------- Similar cars ---------- */
	function renderSimilar() {
		var mine = INDEX[car.id] || {};
		// Same body type first, then the same brand, then anything else — never the same model or a flagged photo.
		var ok = function (c) { return c.id !== car.id && !(INDEX[c.id] && mine.m && INDEX[c.id].m === mine.m) && ['24', '20', '35'].indexOf(c.id) === -1; };
		var score = function (c) { return (c.body === car.body ? 0 : 2) + (c.brand === car.brand ? 0 : 1); };
		var pool = STOCK.filter(ok).map(function (c, i) { return { c: c, s: score(c), i: i }; })
			.sort(function (x, y) { return x.s - y.s || x.i - y.i; }).map(function (x) { return x.c; });
		$('[data-similar]').innerHTML = pool.slice(0, 3).map(AS.carCard).join('');
	}

	/* ---------- Calculator, prefilled with this car ---------- */
	function setupCalc() {
		var price = $('#price');
		var down = $('#down');
		var out = $('#o-monthly');
		var shown = { v: 0 };
		if (car.price) {
			price.value = Math.min(+price.max, car.price);
			$('[data-calc-lead]').textContent = 'سعر ' + car.name + ' كاش ' + fmt.format(car.price) + ' ريال. حرّك الدفعة الأولى والمدة لتعرف القسط التقريبي.';
		} else {
			$('[data-calc-note]').textContent = 'سعر هذه السيارة عند الطلب، فعدّل السعر لتقدير القسط. حساب تقديري بنسبة ربح سنوية 4.5%، والقسط النهائي حسب موافقة جهة التمويل.';
		}
		function fill(el) { el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); }
		function calc() {
			var p = +price.value;
			var m = +$('input[name="term"]:checked').value;
			var monthly = AS.monthly(p, +down.value, m);
			$('#o-price').textContent = fmt.format(p) + ' ريال';
			$('#o-down').textContent = down.value + '% (' + fmt.format(Math.round(p * down.value / 100)) + ' ريال)';
			fill(price); fill(down);
			if (hasGsap) {
				gsap.to(shown, { v: monthly, duration: 0.45, ease: 'power2.out', onUpdate: function () { out.textContent = fmt.format(Math.round(shown.v)) + ' ريال'; } });
			} else { out.textContent = fmt.format(monthly) + ' ريال'; }
		}
		[price, down].forEach(function (el) { el.addEventListener('input', calc); });
		$$('input[name="term"]').forEach(function (el) { el.addEventListener('change', calc); });
		calc();
	}

	/* ---------- Request dialog → WhatsApp ---------- */
	function setupRequest() {
		var dlg = $('#req');
		var form = $('[data-req-form]');
		var seg = $('[data-req-pay]');
		var pay = 'cash';
		function setPay(p) {
			pay = p;
			seg.dataset.pay = p;
			$$('.seg__btn', seg).forEach(function (b) {
				var on = b.dataset.pay === p;
				b.classList.toggle('is-active', on);
				b.setAttribute('aria-checked', String(on));
			});
			$('[data-finance-only]', form).forEach(function (el) { el.hidden = p !== 'finance'; });
			$('[data-drive-only]', form).forEach(function (el) { el.hidden = p !== 'drive'; });
			seg.hidden = p === 'drive';
			$('[data-req-title]').textContent = p === 'finance' ? 'اطلب تمويل هذه السيارة' : (p === 'drive' ? 'احجز تجربة قيادة' : 'اطلب السيارة');
		}
		$$('.seg__btn', seg).forEach(function (b) { b.addEventListener('click', function () { setPay(b.dataset.pay); }); });
		$$('[data-open-request]').forEach(function (b) {
			b.addEventListener('click', function (e) {
				e.preventDefault();
				setPay(b.dataset.openRequest);
				$('[data-req-car]').textContent = car.name + (color ? ' · ' + color : '');
				$('[data-req-error]').hidden = true;
				if (typeof dlg.showModal === 'function') { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
				form.querySelector('input[name="name"]').focus();
			});
		});
		$('[data-req-close]').addEventListener('click', function () { dlg.close(); });
		dlg.addEventListener('click', function (e) { if (e.target === dlg) { dlg.close(); } });
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var f = form.elements;
			var phoneOk = /^(05\d{8}|\+?9665\d{8})$/.test(f.phone.value.replace(/\s/g, ''));
			if (!f.name.value.trim() || !phoneOk || !f.city.value) {
				$('[data-req-error]').hidden = false;
				(!f.name.value.trim() ? f.name : (!phoneOk ? f.phone : f.city)).focus();
				return;
			}
			var lines = [
				(pay === 'drive' ? 'حجز تجربة قيادة' : 'طلب ' + (pay === 'finance' ? 'تمويل' : 'شراء كاش')) + ': ' + car.name,
				color ? 'اللون: ' + color : '',
				'الاسم: ' + f.name.value.trim(),
				'الجوال: ' + f.phone.value.trim(),
				'المدينة: ' + f.city.value,
				pay === 'finance' && f.salary.value ? 'الراتب: ' + f.salary.value : '',
				pay === 'finance' && f.employer.value ? 'جهة العمل: ' + f.employer.value : '',
				pay === 'drive' && f.day.value ? 'اليوم: ' + f.day.value : '',
				pay === 'drive' && f.time.value ? 'الوقت: ' + f.time.value : '',
				location.href
			].filter(Boolean);
			window.open(AS.WA + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
			dlg.close();
		});
	}

	/* ---------- Mobile buy bar shows once the purchase card scrolls away ---------- */
	function setupBuybar() {
		var bar = $('[data-buybar]');
		if (!('IntersectionObserver' in window)) { bar.classList.add('is-visible'); return; }
		new IntersectionObserver(function (entries) {
			bar.classList.toggle('is-visible', !entries[0].isIntersecting);
		}).observe($('.buy__ctas'));
	}

	/* ---------- Motion ---------- */
	function motion() {
		if (!hasGsap) { return; }
		AS.revealHeadings();

		// Title words rise like the homepage headline.
		var title = $('[data-name]');
		title.innerHTML = title.textContent.split(/\s+/).map(function (w) { return '<span class="w"><span>' + AS.esc(w) + '</span></span>'; }).join(' ');

		// Arrival: the photo is unveiled, the purchase card slides in from the reading side.
		var desktop = window.matchMedia('(min-width: 1081px)').matches;
		gsap.timeline({ defaults: { ease: 'power3.out' } })
			.fromTo('.gallery__stage', { clipPath: 'inset(0% 0% 100% 0% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.2, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
			.from('[data-gallery-img]', { scale: 1.18, duration: 1.6 }, 0.1)
			.from('.gallery__bar, .gallery__nav', { opacity: 0, duration: 0.6 }, 0.9)
			.from('.thumb', { opacity: 0, y: 14, duration: 0.5, stagger: 0.04 }, 0.8)
			.from('.buy', { opacity: 0, x: desktop ? -40 : 0, y: desktop ? 0 : 30, duration: 1 }, 0.2)
			.from('.buy__title .w > span', { yPercent: 115, duration: 1, stagger: 0.06, ease: 'power4.out' }, 0.45)
			.from('.buy__meta li, .buy__badges .badge', { opacity: 0, y: 8, duration: 0.5, stagger: 0.05 }, 0.7)
			.from('.buy__price > *', { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, 0.85)
			.from('.swatch', { scale: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(2.4)' }, 1)
			.from('.buy__ctas > *', { opacity: 0, y: 12, duration: 0.6, stagger: 0.07 }, 1.05);

		// Quick look: tiles flip up one after another like gauges coming alive.
		gsap.set('.quick__item', { opacity: 0, rotationX: -70, transformOrigin: '50% 100%' });
		AS.onView('.quick', 'top 85%', function () {
			gsap.to('.quick__item', { opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.06, ease: 'back.out(1.6)', clearProps: 'transform' });
		});

		// Specs: each card opens from the top, then its checklist ticks down.
		$$('.spec').forEach(function (box) {
			gsap.set(box, { clipPath: 'inset(0% 0% 100% 0% round 12px)' });
			gsap.set($$('li:not(.spec__extra)', box), { opacity: 0, x: 16 });
			AS.onView(box, 'top 88%', function () {
				gsap.timeline()
					.to(box, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 0.9, ease: 'power3.inOut' })
					.to($$('li:not(.spec__extra)', box), { opacity: 1, x: 0, duration: 0.45, stagger: 0.04, ease: 'power2.out' }, 0.45)
					.set(box, { clearProps: 'clipPath' });
			});
		});

		// Trims slide in from the side.
		gsap.set('.trims li', { opacity: 0, x: desktop ? -50 : 0, y: desktop ? 0 : 20 });
		AS.onView('.trims', 'top 88%', function () {
			gsap.to('.trims li', { opacity: 1, x: 0, y: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out' });
		});

		// Calculator tilts up into place.
		gsap.set('.calc', { opacity: 0, y: 70, rotation: -2.5 });
		AS.onView('.cp-fin', 'top 75%', function () {
			gsap.to('.calc', { opacity: 1, y: 0, rotation: 0, duration: 1.2, ease: 'expo.out' });
		});

		// "With every car": photos wipe open one after another.
		gsap.set('.with__item', { clipPath: 'inset(0% 0% 0% 100% round 12px)' });
		AS.onView('.with', 'top 82%', function () {
			gsap.to('.with__item', { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.1, stagger: 0.12, ease: 'expo.inOut', clearProps: 'clipPath' });
		});

		// Similar cars drive in from their own side.
		var grid = $('[data-similar]');
		gsap.set(grid.children, { opacity: 0 });
		AS.onView(grid, 'top 85%', function () {
			var mid = grid.getBoundingClientRect().left + grid.offsetWidth / 2;
			Array.prototype.forEach.call(grid.children, function (el, i) {
				var r = el.getBoundingClientRect();
				var fromRight = grid.offsetWidth < 700 ? true : r.left + r.width / 2 > mid;
				gsap.fromTo(el, { x: (fromRight ? 1 : -1) * (grid.offsetWidth < 700 ? 0 : 120), y: grid.offsetWidth < 700 ? 30 : 0, opacity: 0 },
					{ x: 0, y: 0, opacity: 1, duration: 1.1, delay: i * 0.1, ease: 'expo.out', clearProps: 'transform' });
				var sheen = el.querySelector('.car__sheen');
				if (sheen) { gsap.fromTo(sheen, { xPercent: 130 }, { xPercent: -130, duration: 1.2, delay: 0.45 + i * 0.1, ease: 'power2.inOut' }); }
			});
		});
	}
})();
