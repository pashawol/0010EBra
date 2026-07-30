// import Swiper from '../libs/swiper/swiper-bundle.min.mjs';
// import JSCCommon from "./JSCCommon.js";

function eventHandler() {
	// const $ = jQuery;
	window.JSCCommon.init()
	let navScrollTicking = false

	function whenResize() {
		window.JSCCommon.setFixedNav()
	}

	function onScroll() {
		if (navScrollTicking) return
		navScrollTicking = true
		window.requestAnimationFrame(() => {
			window.JSCCommon.setFixedNav()
			navScrollTicking = false
		})
	}

	window.addEventListener('scroll', onScroll, { passive: true })
	window.addEventListener('resize', whenResize, { passive: true })

	whenResize()

	const defaultSl = {
		spaceBetween: 0,
		lazy: {
			loadPrevNext: true,
		},
		watchOverflow: true,
		loop: true,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
		pagination: {
			el: ' .swiper-pagination',
			type: 'bullets',
			clickable: true,
			// renderBullet: function (index, className) {
			// 	return '<span class="' + className + '">' + (index + 1) + '</span>';
			// }
		},
	}

	new Swiper('.breadcrumb-slider--js', {
		slidesPerView: 'auto',
		freeMode: true,
		watchOverflow: true,
	})

	new Swiper('.sBanners__slider--js', {
		// slidesPerView: 5,
		...defaultSl,
		slidesPerView: 'auto',
		freeMode: true,
		loopFillGroupWithBlank: true,
		touchRatio: 0.2,
		slideToClickedSlide: true,
		freeModeMomentum: true,
	})

	initDataSwipers()
}

/**
 * Единый инициализатор слайдеров: опции объявляются в разметке через
 * data-swiper-options, JS их только читает.
 *
 * Сделано так осознанно: в эталонных проектах студии Swiper поднимался
 * 23 раза копипастой конфигов под конкретные классы, из-за чего любой новый
 * слайдер требовал правки общего common.js — при параллельной вёрстке блоков
 * это точка постоянных конфликтов. Здесь блок целиком владеет своими опциями.
 */
function initDataSwipers() {
	const nodes = document.querySelectorAll('[data-swiper-options]')

	for (const el of nodes) {
		// Защита от повторной инициализации (в т.ч. если блок пересобрали динамически)
		if (el.swiper) continue

		let options = {}
		try {
			options = JSON.parse(el.dataset.swiperOptions || '{}')
		} catch (error) {
			// Молча падать нельзя: слайдер просто не поедет, и причину не найти
			console.error('[swiper] некорректный JSON в data-swiper-options', el, error)
			continue
		}

		// Навигацию и пагинацию ищем ВНУТРИ блока, а не по документу:
		// на странице несколько слайдеров, глобальные селекторы их перепутают.
		const scope = el.closest('[data-swiper-scope]') || el.parentElement || el

		if (options.navigation === true) {
			options.navigation = {
				nextEl: scope.querySelector('.swiper-button-next'),
				prevEl: scope.querySelector('.swiper-button-prev'),
			}
		}

		if (options.pagination === true) {
			options.pagination = { el: scope.querySelector('.swiper-pagination'), clickable: true }
		}

		new Swiper(el, options)
	}
}
if (document.readyState !== 'loading') {
	eventHandler()
} else {
	document.addEventListener('DOMContentLoaded', eventHandler)
}

// window.onload = function () {
// 	document.body.classList.add('loaded_hiding');
// 	window.setTimeout(function () {
// 		document.body.classList.add('loaded');
// 		document.body.classList.remove('loaded_hiding');
// 	}, 500);
// }
