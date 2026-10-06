/* Cars listing (cars.html): filters live in the URL so every link from the homepage, brands
   page and footer lands on a filtered view — cars.html?brand=toyota, ?origin=cn, ?body=suv, ?budget=0-80000 … */
(function () {
	'use strict';

	var C = window.CATALOG;
	var fmt = AS.fmt;
	var STOCK = (window.STOCK || []).slice();

	var BODY_ALIAS = { suv: 'عائلي', sedan: 'سيدان', hatchback: 'هاتشباك', commercial: 'تجاري' };
	var BODIES = [
		{ id: 'suv', label: 'عائلي (SUV)', test: function (c) { return c.body === 'عائلي'; } },
		{ id: 'sedan', label: 'سيدان', test: function (c) { return c.body === 'سيدان'; } },
		{ id: '4x4', label: 'دفع رباعي', test: function (c) { return /رباعي/.test(c.drive); } },
		{ id: 'commercial', label: 'تجاري وبيك أب', test: function (c) { return c.body === 'تجاري' || /بيك|غمارتين|1500/.test(c.name); } },
		{ id: 'hatchback', label: 'هاتشباك', test: function (c) { return c.body === 'هاتشباك'; } }
	];
	var FUELS = [
		{ id: 'petrol', label: 'بنزين', test: function (c) { return c.fuel === 'بنزين'; } },
		{ id: 'diesel', label: 'ديزل', test: function (c) { return c.fuel === 'ديزل'; } },
		{ id: 'hybrid', label: 'هايبرد وكهرباء', test: function (c) { return /هايبرد|كهرب/.test(c.fuel + c.name); } }
	];
	var YEARS = ['2026', '2025', '2024'];

	/* ---------- State from the URL ---------- */
	var p = new URLSearchParams(location.search);
	var state = {
		q: p.get('q') || '',
		pay: p.get('pay') === 'finance' ? 'finance' : 'cash',
		price: '',
		monthly: '',
		brand: (p.get('brand') || '').split(',').filter(function (b) { return C.BRANDS[b]; }),
		origin: C.ORIGINS[p.get('origin')] ? p.get('origin') : '',
		body: p.get('body') || '',
		fuel: p.get('fuel') || '',
		year: p.get('year') || '',
		offer: p.get('offer') === '1',
		sort: p.get('sort') || 'new',
		view: p.get('view') === 'list' ? 'list' : 'grid'
	};
	// Homepage search sends Arabic body names and one "budget" field for both cash and finance.
	Object.keys(BODY_ALIAS).forEach(function (k) { if (state.body === BODY_ALIAS[k]) { state.body = k; } });
	if (state.body === 'دفع رباعي') { state.body = '4x4'; }
	if (state.body === 'هايبرد وكهرباء') { state.body = ''; state.fuel = 'hybrid'; }
	var budget = p.get('budget') || p.get('price') || '';
	if (/^m/.test(budget)) { state.pay = 'finance'; state.monthly = budget.slice(1); } else if (budget) { state.price = budget; }
	if (p.get('monthly')) { state.pay = 'finance'; state.monthly = p.get('monthly'); }

	/* ---------- Filtering ---------- */
	function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
	function matches(c, skip) {
		if (state.q && skip !== 'q') {
			var q = state.q.trim().toLowerCase();
			var hay = (c.name + ' ' + (C.BRANDS[c.brand] ? C.BRANDS[c.brand].ar : '') + ' ' + c.brand).toLowerCase();
			if (hay.indexOf(q) === -1) { return false; }
		}
		if (state.brand.length && skip !== 'brand' && state.brand.indexOf(c.brand) === -1) { return false; }
		if (state.origin && skip !== 'origin' && c.origin !== state.origin) { return false; }
		if (state.body && skip !== 'body' && byId(BODIES, state.body) && !byId(BODIES, state.body).test(c)) { return false; }
		if (state.fuel && skip !== 'fuel' && byId(FUELS, state.fuel) && !byId(FUELS, state.fuel).test(c)) { return false; }
		if (state.year && skip !== 'year' && String(c.year) !== state.year) { return false; }
		if (state.offer && skip !== 'offer' && !c.was) { return false; }
		if (state.pay === 'cash' && state.price && skip !== 'price' && !(c.price && C.inBand(c.price, state.price))) { return false; }
		if (state.pay === 'finance' && state.monthly && skip !== 'price' && !(c.price && C.inBand(AS.monthly(c.price), state.monthly))) { return false; }
		return true;
	}
	function results() {
		var list = STOCK.filter(function (c) { return matches(c); });
		var s = state.sort;
		list.sort(function (a, b) {
			if (s === 'low') { return (a.price || 9e9) - (b.price || 9e9); }
			if (s === 'high') { return (b.price || 0) - (a.price || 0); }
			if (s === 'offer') { return (b.was ? 1 : 0) - (a.was ? 1 : 0) || a.order - b.order; }
			return a.order - b.order;
		});
		return list;
	}
	// How many cars a chip would show, given every other active filter.
	function countWith(key, fn) {
		return STOCK.filter(function (c) { return matches(c, key) && fn(c); }).length;
	}

	/* ---------- Filter UI ---------- */
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var panel = $('[data-filters]');

	function chip(group, id, label, active, n) {
		return '<button type="button" class="fchip' + (active ? ' is-active' : '') + '" data-group="' + group + '" data-id="' + id + '" aria-pressed="' + active + '"' + (n === 0 && !active ? ' disabled style="opacity:.4"' : '') + '>' + label + (n !== undefined ? ' <small>' + n + '</small>' : '') + '</button>';
	}

	function drawFilters() {
		var bands = state.pay === 'cash' ? C.PRICE_BANDS : C.MONTHLY_BANDS;
		var current = state.pay === 'cash' ? state.price : state.monthly;
		var brandCounts = {};
		STOCK.forEach(function (c) { if (matches(c, 'brand')) { brandCounts[c.brand] = (brandCounts[c.brand] || 0) + 1; } });

		$('[data-f-price]').innerHTML =
			'<div class="fseg" role="group" aria-label="طريقة الدفع">' +
				'<button type="button" data-pay="cash" class="' + (state.pay === 'cash' ? 'is-active' : '') + '">كاش</button>' +
				'<button type="button" data-pay="finance" class="' + (state.pay === 'finance' ? 'is-active' : '') + '">قسط شهري</button>' +
			'</div><div class="fchips">' +
			bands.map(function (b) {
				return chip('price', b.id, b.label, current === b.id, countWith('price', function (c) {
					return c.price && C.inBand(state.pay === 'cash' ? c.price : AS.monthly(c.price), b.id);
				}));
			}).join('') + '</div>';

		$('[data-f-origin]').innerHTML = Object.keys(C.ORIGINS).map(function (k) {
			return chip('origin', k, C.ORIGINS[k].ar, state.origin === k, countWith('origin', function (c) { return c.origin === k; }));
		}).join('');

		$('[data-f-brand]').innerHTML = Object.keys(C.BRANDS).filter(function (b) {
			return STOCK.some(function (c) { return c.brand === b; });
		}).map(function (b) {
			var on = state.brand.indexOf(b) !== -1;
			return '<label class="fbrand"><input type="checkbox" value="' + b + '"' + (on ? ' checked' : '') + '>' +
				'<img src="assets/img/logos/brands/' + b + '.webp" alt="" loading="lazy"><span>' + C.BRANDS[b].ar + '</span><small>' + (brandCounts[b] || 0) + '</small></label>';
		}).join('');

		$('[data-f-body]').innerHTML = BODIES.map(function (b) {
			return chip('body', b.id, b.label, state.body === b.id, countWith('body', b.test));
		}).join('');
		$('[data-f-fuel]').innerHTML = FUELS.map(function (f) {
			return chip('fuel', f.id, f.label, state.fuel === f.id, countWith('fuel', f.test));
		}).join('');
		$('[data-f-year]').innerHTML = YEARS.map(function (y) {
			return chip('year', y, y, state.year === y, countWith('year', function (c) { return String(c.year) === y; }));
		}).join('') + chip('offer', '1', 'عليها عرض', state.offer, countWith('offer', function (c) { return !!c.was; }));
	}

	/* ---------- Results ---------- */
	var grid = $('[data-results]');
	var countEl = $('[data-count]');
	var tagsEl = $('[data-tags]');
	var banner = $('[data-brand-banner]');
	var viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));

	function syncViewState() {
		grid.classList.toggle('is-list', state.view === 'list');
		grid.classList.toggle('is-grid', state.view === 'grid');
		viewButtons.forEach(function (button) {
			var active = button.dataset.view === state.view;
			button.classList.toggle('is-active', active);
			button.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	function tags() {
		var t = [];
		if (state.q) { t.push(['q', '', '"' + state.q + '"']); }
		state.brand.forEach(function (b) { t.push(['brand', b, C.BRANDS[b].ar]); });
		if (state.origin) { t.push(['origin', '', C.ORIGINS[state.origin].label]); }
		if (state.price && state.pay === 'cash') { t.push(['price', '', (byId(C.PRICE_BANDS, state.price) || { label: state.price }).label + ' ريال']); }
		if (state.monthly && state.pay === 'finance') { t.push(['price', '', 'قسط ' + (byId(C.MONTHLY_BANDS, state.monthly) || { label: state.monthly }).label + ' ريال']); }
		if (state.body && byId(BODIES, state.body)) { t.push(['body', '', byId(BODIES, state.body).label]); }
		if (state.fuel && byId(FUELS, state.fuel)) { t.push(['fuel', '', byId(FUELS, state.fuel).label]); }
		if (state.year) { t.push(['year', '', 'موديل ' + state.year]); }
		if (state.offer) { t.push(['offer', '', 'عليها عرض']); }
		tagsEl.innerHTML = t.map(function (x) {
			return '<button type="button" class="atag" data-clear="' + x[0] + '" data-id="' + x[1] + '" aria-label="إزالة ' + x[2] + '">' + AS.esc(x[2]) + '</button>';
		}).join('');
	}

	function drawBanner() {
		if (state.brand.length !== 1) { banner.hidden = true; return; }
		var b = state.brand[0];
		var info = C.BRANDS[b];
		banner.hidden = false;
		banner.innerHTML = '<img src="assets/img/logos/brands/' + b + '.webp" alt="">' +
			'<div><h2>سيارات ' + info.ar + ' الجديدة</h2><p>صناعة ' + C.ORIGINS[info.origin].ar.replace(/ة$/, 'ة') + ' · بضمان الوكيل · كاش أو تقسيط</p></div>' +
			'<a href="brands.html" class="link-more">كل العلامات التجارية</a>';
	}

	function syncUrl() {
		var q = new URLSearchParams();
		if (state.q) { q.set('q', state.q); }
		if (state.brand.length) { q.set('brand', state.brand.join(',')); }
		if (state.origin) { q.set('origin', state.origin); }
		if (state.pay === 'finance') { q.set('pay', 'finance'); }
		if (state.pay === 'cash' && state.price) { q.set('price', state.price); }
		if (state.pay === 'finance' && state.monthly) { q.set('monthly', state.monthly); }
		if (state.body) { q.set('body', state.body); }
		if (state.fuel) { q.set('fuel', state.fuel); }
		if (state.year) { q.set('year', state.year); }
		if (state.offer) { q.set('offer', '1'); }
		if (state.sort !== 'new') { q.set('sort', state.sort); }
		if (state.view !== 'grid') { q.set('view', state.view); }
		var s = q.toString();
		history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
	}

	var first = true;
	function render() {
		var list = results();
		syncViewState();
		countEl.innerHTML = '<span>' + list.length + '</span> ' + (list.length === 1 ? 'سيارة' : (list.length === 2 ? 'سيارتان' : (list.length <= 10 ? 'سيارات' : 'سيارة')));
		$('[data-apply-count]').textContent = list.length;
		grid.innerHTML = list.length ? list.map(AS.carCard).join('') :
			'<div class="empty"><strong>ما فيه سيارات بهذه المواصفات حاليًا</strong><p>جرّب تخفّف الفلاتر، أو اطلبها منّا ونوفّرها لك.</p>' +
			'<button type="button" class="btn btn--navy" data-reset>مسح الفلاتر</button> <a class="btn btn--wa" href="' + AS.WA + encodeURIComponent('مرحبًا، أبحث عن سيارة غير متوفرة في الموقع') + '" target="_blank" rel="noopener">اطلبها عبر واتساب</a></div>';
		drawFilters();
		tags();
		drawBanner();
		if (!first) { syncUrl(); }
		if (AS.hasGsap) {
			gsap.fromTo(grid.querySelectorAll('.car'), { opacity: 0, y: first ? 30 : 14 }, {
				opacity: 1, y: 0, duration: first ? 0.9 : 0.5, stagger: 0.05, ease: 'power3.out', clearProps: 'transform'
			});
		}
		first = false;
	}

	/* ---------- Events ---------- */
	panel.addEventListener('click', function (e) {
		var pay = e.target.closest('[data-pay]');
		if (pay) { state.pay = pay.dataset.pay; render(); return; }
		var c = e.target.closest('.fchip');
		if (!c) { return; }
		var g = c.dataset.group;
		var id = c.dataset.id;
		if (g === 'price') {
			var key = state.pay === 'cash' ? 'price' : 'monthly';
			state[key] = state[key] === id ? '' : id;
		} else if (g === 'offer') {
			state.offer = !state.offer;
		} else {
			state[g] = state[g] === id ? '' : id;
		}
		render();
	});
	panel.addEventListener('change', function (e) {
		if (e.target.type !== 'checkbox') { return; }
		var b = e.target.value;
		state.brand = e.target.checked ? state.brand.concat(b) : state.brand.filter(function (x) { return x !== b; });
		render();
	});
	var search = $('[data-q]');
	search.value = state.q;
	var timer;
	search.addEventListener('input', function () {
		clearTimeout(timer);
		timer = setTimeout(function () { state.q = search.value; render(); }, 220);
	});
	tagsEl.addEventListener('click', function (e) {
		var t = e.target.closest('[data-clear]');
		if (!t) { return; }
		var k = t.dataset.clear;
		if (k === 'brand') { state.brand = state.brand.filter(function (x) { return x !== t.dataset.id; }); }
		else if (k === 'price') { state.price = ''; state.monthly = ''; }
		else if (k === 'offer') { state.offer = false; }
		else { state[k] = ''; if (k === 'q') { search.value = ''; } }
		render();
	});
	function reset() {
		state = { q: '', pay: state.pay, price: '', monthly: '', brand: [], origin: '', body: '', fuel: '', year: '', offer: false, sort: state.sort, view: state.view };
		search.value = '';
		render();
	}
	document.addEventListener('click', function (e) { if (e.target.closest('[data-reset]')) { reset(); } });

	var sort = $('[data-sort]');
	sort.value = state.sort;
	sort.addEventListener('change', function () { state.sort = sort.value; render(); });

	viewButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			state.view = button.dataset.view;
			render();
		});
	});

	// Mobile: filters slide in as a drawer.
	var scrim = $('[data-scrim]');
	function drawer(open) {
		panel.classList.toggle('is-open', open);
		scrim.hidden = !open;
		document.body.style.overflow = open ? 'hidden' : '';
		if (open) { panel.focus(); }
	}
	$('[data-open-filters]').addEventListener('click', function () { drawer(true); });
	$('[data-close-filters]').addEventListener('click', function () { drawer(false); });
	$('[data-apply]').addEventListener('click', function () { drawer(false); window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 140 }); });
	scrim.addEventListener('click', function () { drawer(false); });
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('is-open')) { drawer(false); } });

	render();
	if (AS.hasGsap) { AS.revealHeadings('.phead__title'); }
})();
