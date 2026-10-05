/* Catalog helpers shared by the listing, brands and offers pages.
   DEMO_PRICES / DEMO_WAS are placeholder prices for the UI only — replace with the dealer's real prices. */
(function () {
	'use strict';

	var DEMO_PRICES = {
		'02': 129000, '03': 165000, '04': 289000, '05': 62000, '06': 134000, '07': 89000, '08': 99000, '09': 86000,
		'10': 58000, '11': 98000, '12': 128000, '13': 175000, '14': 112000, '16': 365000, '17': 105000, '18': 158000,
		'19': 149000, '20': 389000, '21': 215000, '22': 195000, '23': 82000, '24': 108000, '25': 84000, '26': 64000,
		'27': 92000, '28': 118000, '29': 109000, '30': 99000, '31': 119000, '32': 127000, '33': 189000, '34': 115000,
		'35': 118000, '36': 99000
	};
	// Cars on offer: the price before the discount.
	var DEMO_WAS = { '05': 69000, '10': 63500, '17': 114000, '23': 88000, '26': 69500, '35': 126000, '12': 139000, '21': 232000 };

	var ORIGINS = {
		cn: { ar: 'صينية', label: 'السيارات الصينية' },
		jp: { ar: 'يابانية', label: 'السيارات اليابانية' },
		kr: { ar: 'كورية', label: 'السيارات الكورية' },
		us: { ar: 'أمريكية', label: 'السيارات الأمريكية' }
	};

	var BRANDS = {
		hyundai: { ar: 'هيونداي', origin: 'kr' },
		toyota: { ar: 'تويوتا', origin: 'jp' },
		nissan: { ar: 'نيسان', origin: 'jp' },
		ford: { ar: 'فورد', origin: 'us' },
		kia: { ar: 'كيا', origin: 'kr' },
		mg: { ar: 'ام جي', origin: 'cn' },
		infiniti: { ar: 'إنفينيتي', origin: 'jp' },
		isuzu: { ar: 'إيسوزو', origin: 'jp' },
		geely: { ar: 'جيلي', origin: 'cn' },
		chery: { ar: 'شيري', origin: 'cn' },
		honda: { ar: 'هوندا', origin: 'jp' },
		foton: { ar: 'فوتون', origin: 'cn' },
		chevrolet: { ar: 'شيفروليه', origin: 'us' },
		byd: { ar: 'بي واي دي', origin: 'cn' },
		jetour: { ar: 'جيتور', origin: 'cn' },
		ram: { ar: 'رام', origin: 'us' }
	};

	// Cash price bands and monthly-installment bands used by the search and the listing filters.
	var PRICE_BANDS = [
		{ id: '0-80000', label: 'أقل من 80 ألف' },
		{ id: '80000-120000', label: '80 – 120 ألف' },
		{ id: '120000-200000', label: '120 – 200 ألف' },
		{ id: '200000-300000', label: '200 – 300 ألف' },
		{ id: '300000-', label: 'أكثر من 300 ألف' }
	];
	var MONTHLY_BANDS = [
		{ id: '0-1500', label: 'أقل من 1,500' },
		{ id: '1500-2500', label: '1,500 – 2,500' },
		{ id: '2500-4000', label: '2,500 – 4,000' },
		{ id: '4000-', label: 'أكثر من 4,000' }
	];

	var stock = window.STOCK || [];
	stock.forEach(function (c, i) {
		if (!c.price && DEMO_PRICES[c.id]) { c.price = DEMO_PRICES[c.id]; }
		if (DEMO_WAS[c.id]) { c.was = DEMO_WAS[c.id]; }
		c.origin = BRANDS[c.brand] ? BRANDS[c.brand].origin : '';
		c.year = +(c.name.match(/20\d\d/) || [0])[0];
		c.order = i; // newest first, as listed
		if (!c.fuel && /كهرباء/.test(c.name)) { c.fuel = 'هايبرد'; }
	});

	window.CATALOG = {
		ORIGINS: ORIGINS,
		BRANDS: BRANDS,
		PRICE_BANDS: PRICE_BANDS,
		MONTHLY_BANDS: MONTHLY_BANDS,
		inBand: function (value, band) {
			if (!band) { return true; }
			var p = band.split('-');
			var lo = +p[0] || 0;
			var hi = p[1] ? +p[1] : Infinity;
			return value >= lo && value < hi;
		},
		countBy: function (list, key) {
			var o = {};
			list.forEach(function (c) { o[c[key]] = (o[c[key]] || 0) + 1; });
			return o;
		}
	};
})();
