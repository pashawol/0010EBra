/**
 * Transition 5 — раскадровка Figma (576:2 → 602:1540 … 604:2696, 6 шагов,
 * самая длинная сцена по плану). Разбор кадров — docs/coordination/anim-t45.md.
 *
 * Кадры показывают три статичных состояния подряд: конец sTestimonials
 * (видео-карточки отзывов), sBooking (заголовок «Каждая женщина
 * заслуживает…» + белая карточка формы записи на фото) и переход в footer
 * (дуга .footer__transition-shape → монограмма → wordmark «Esthetic Bra»).
 *
 * Как и в Transition 4, метаданные Figma по шагам 1–3 показывают, что
 * карточка формы (.sBooking__card) движется по экрану СИНХРОННО с секцией
 * (её относительная позиция внутри секции не меняется ни на одном шаге) —
 * то есть карточка НЕ запинена и НЕ ловит отдельный параллакс, это обычный
 * элемент в потоке. Значит пин здесь не нужен: 6 шагов раскадровки — это
 * просто более длинная дистанция скролла (секция выше), а не признак пина.
 * Проверено отдельно в замерах (см. отчёт координатору): высота документа не
 * должна вырасти относительно того, что и так даёт разметка.
 *
 * Что сцена добавляет поверх «голого» скролла:
 * 1. Карточки sTestimonials (.sTestimonials__card) — stagger-появление по
 *    мере входа секции в вьюпорт (в блоке нет .eb-title/.eb-fact на самих
 *    карточках — общий revealOnEnter из anim.js их не покрывает, только
 *    заголовок секции).
 * 2. sBooking: заголовок (custom h2, не .eb-title — тоже вне общего
 *    reveal), карточка формы и декоративная монограмма фона — раздельные
 *    entrance-эффекты, декор дополнительно получает лёгкий параллакс на
 *    десктопе (без пина — секция без Swiper, конфликта transform нет).
 * 3. footer__brand (монограмма + wordmark) — сцена «проявления бренда»
 *    ровно там, где раскадровка рисует дугу с растущей монограммой: иконка
 *    масштабируется от 0.5 до 1 с лёгким поворотом, wordmark всплывает
 *    следом с небольшой задержкой.
 *
 * Архитектура — конвенция anim.js: gsap.context на сцену, gsap.matchMedia(),
 * prefers-reduced-motion выключает всё, старт задаёт JS.
 */
// ;(() => {
// 	const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

// 	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
// 	gsap.registerPlugin(ScrollTrigger)

// 	const testimonialsSection = document.getElementById('sTestimonials')
// 	const bookingSection = document.getElementById('sBooking')
// 	const footer = document.querySelector('.footer')

// 	if (!testimonialsSection && !bookingSection && !footer) return

// 	/** Карточки отзывов появляются с небольшим stagger при входе секции. */
// 	function testimonialsReveal() {
// 		if (!testimonialsSection) return
// 		const cards = testimonialsSection.querySelectorAll('.sTestimonials__card')
// 		if (!cards.length) return

// 		gsap.fromTo(
// 			cards,
// 			{ autoAlpha: 0, y: 40 },
// 			{
// 				autoAlpha: 1,
// 				y: 0,
// 				duration: 0.7,
// 				ease: 'power2.out',
// 				stagger: 0.12,
// 				scrollTrigger: {
// 					trigger: testimonialsSection,
// 					start: 'top 85%',
// 					once: true,
// 				},
// 			},
// 		)
// 	}

// 	/**
// 	 * Заголовок и карточка формы sBooking появляются раздельно (заголовок
// 	 * чуть раньше карточки — читается как в раскадровке: сначала текст,
// 	 * потом форма поверх фото).
// 	 */
// 	function bookingReveal() {
// 		if (!bookingSection) return
// 		const titleMain = bookingSection.querySelector('.sBooking__title-main')
// 		const titleTail = bookingSection.querySelector('.sBooking__title-tail')
// 		const card = bookingSection.querySelector('.sBooking__card')

// 		const targets = [titleMain, titleTail].filter(Boolean)
// 		if (targets.length) {
// 			gsap.fromTo(
// 				targets,
// 				{ autoAlpha: 0, y: 32 },
// 				{
// 					autoAlpha: 1,
// 					y: 0,
// 					duration: 0.8,
// 					ease: 'power2.out',
// 					stagger: 0.15,
// 					scrollTrigger: {
// 						trigger: bookingSection,
// 						start: 'top 80%',
// 						once: true,
// 					},
// 				},
// 			)
// 		}

// 		if (card) {
// 			gsap.fromTo(
// 				card,
// 				{ autoAlpha: 0, y: 48, scale: 0.96 },
// 				{
// 					autoAlpha: 1,
// 					y: 0,
// 					scale: 1,
// 					duration: 0.9,
// 					ease: 'power2.out',
// 					delay: 0.1,
// 					scrollTrigger: {
// 						trigger: card,
// 						start: 'top 88%',
// 						once: true,
// 					},
// 				},
// 			)
// 		}
// 	}

// 	/**
// 	 * Декоративная фоновая монограмма (.sBooking__decor) — медленный
// 	 * параллакс на десктопе, тем же приёмом, что и parallaxMedia в anim.js
// 	 * (без пина: секция не содержит Swiper, конфликта transform нет).
// 	 */
// 	function bookingDecorParallax() {
// 		if (!bookingSection) return
// 		const decor = bookingSection.querySelector('.sBooking__decor')
// 		if (!decor) return

// 		gsap.fromTo(
// 			decor,
// 			{ yPercent: -8 },
// 			{
// 				yPercent: 8,
// 				ease: 'none',
// 				scrollTrigger: {
// 					trigger: bookingSection,
// 					start: 'top bottom',
// 					end: 'bottom top',
// 					scrub: true,
// 				},
// 			},
// 		)
// 	}

// 	/**
// 	 * Проявление бренда в футере: монограмма растёт из 0.5 с лёгким
// 	 * доворотом, wordmark всплывает следом — момент, который в раскадровке
// 	 * рисует дуга .footer__transition-shape, растущая к монограмме (шаги 4–6
// 	 * Transition 5).
// 	 */
// 	function footerBrandReveal() {
// 		if (!footer) return
// 		const brand = footer.querySelector('.footer__brand')
// 		if (!brand) return
// 		const monogram = brand.querySelector('.footer__monogram')
// 		const wordmark = brand.querySelector('.footer__wordmark')

// 		const tl = gsap.timeline({
// 			scrollTrigger: {
// 				trigger: brand,
// 				start: 'top 85%',
// 				once: true,
// 			},
// 		})

// 		if (monogram) {
// 			tl.fromTo(
// 				monogram,
// 				{ autoAlpha: 0, scale: 0.5, rotate: -8 },
// 				{ autoAlpha: 1, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.6)' },
// 			)
// 		}
// 		if (wordmark) {
// 			tl.fromTo(
// 				wordmark,
// 				{ autoAlpha: 0, y: 28 },
// 				{ autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' },
// 				monogram ? '-=0.25' : 0,
// 			)
// 		}
// 	}

// 	function initScene() {
// 		if (PREFERS_REDUCED.matches) return

// 		const mm = gsap.matchMedia()

// 		// Мобильные: только entrance-reveal'ы, без scrub-параллакса декора —
// 		// правило anim.js/PLAN §6, тяжёлые scrub-сценарии на слабых
// 		// устройствах дают рваный скролл.
// 		mm.add('(max-width: 991px)', () => {
// 			const ctx = gsap.context(() => {
// 				testimonialsReveal()
// 				bookingReveal()
// 				footerBrandReveal()
// 			})
// 			return () => ctx.revert()
// 		})

// 		mm.add('(min-width: 992px)', () => {
// 			const ctx = gsap.context(() => {
// 				testimonialsReveal()
// 				bookingReveal()
// 				bookingDecorParallax()
// 				footerBrandReveal()
// 			})
// 			return () => ctx.revert()
// 		})
// 	}

// 	PREFERS_REDUCED.addEventListener('change', () => {
// 		for (const st of ScrollTrigger.getAll()) {
// 			const t = st.vars.trigger
// 			if (t === testimonialsSection || t === bookingSection || footer?.contains(t)) {
// 				st.kill()
// 			}
// 		}
// 		initScene()
// 		ScrollTrigger.refresh()
// 	})

// 	if (document.readyState === 'loading') {
// 		document.addEventListener('DOMContentLoaded', initScene)
// 	} else {
// 		initScene()
// 	}
// })()
