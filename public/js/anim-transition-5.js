/**
 * Transition 5 — раскадровка Figma (576:2 → 602:1540 … 604:2696, 6 шагов,
 * самая длинная сцена по плану). Разбор кадров — docs/coordination/anim-t45.md.
 *
 * sBooking сознательно исключён из этой сцены — вёрстка блока ещё не
 * стабилизирована, анимацию делаем отдельно позже (Pavel, 2026-08-15).
 *
 * Что сцена добавляет поверх «голого» скролла:
 * 1. Карточки sTestimonials (.sTestimonials__card) — stagger-появление по
 *    мере входа секции в вьюпорт (в блоке нет .eb-title/.eb-fact на самих
 *    карточках — общий revealOnEnter из anim.js их не покрывает, только
 *    заголовок секции).
 * 2. footer__brand (монограмма + wordmark) — сцена «проявления бренда»
 *    ровно там, где раскадровка рисует дугу с растущей монограммой: иконка
 *    масштабируется от 0.5 до 1 с лёгким поворотом, wordmark всплывает
 *    следом с небольшой задержкой.
 *
 * Архитектура — конвенция anim.js: gsap.context на сцену, gsap.matchMedia(),
 * prefers-reduced-motion выключает всё, старт задаёт JS.
 */
;(() => {
	const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
	gsap.registerPlugin(ScrollTrigger)

	const testimonialsSection = document.getElementById('sTestimonials')
	const footer = document.querySelector('.footer')

	if (!testimonialsSection && !footer) return

	/** Карточки отзывов появляются с небольшим stagger при входе секции. */
	function testimonialsReveal() {
		if (!testimonialsSection) return
		const cards = testimonialsSection.querySelectorAll('.sTestimonials__card')
		if (!cards.length) return

		gsap.fromTo(
			cards,
			{ autoAlpha: 0, y: 40 },
			{
				autoAlpha: 1,
				y: 0,
				duration: 0.7,
				ease: 'power2.out',
				stagger: 0.12,
				scrollTrigger: {
					trigger: testimonialsSection,
					start: 'top 85%',
					once: true,
				},
			},
		)
	}

	/**
	 * Проявление бренда в футере: монограмма растёт из 0.5 с лёгким
	 * доворотом, wordmark всплывает следом — момент, который в раскадровке
	 * рисует дуга .footer__transition-shape, растущая к монограмме (шаги 4–6
	 * Transition 5).
	 */
	function footerBrandReveal() {
		if (!footer) return
		const brand = footer.querySelector('.footer__brand')
		if (!brand) return
		const monogram = brand.querySelector('.footer__monogram')
		const wordmark = brand.querySelector('.footer__wordmark')

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: brand,
				start: 'top 85%',
				once: true,
			},
		})

		if (monogram) {
			tl.fromTo(
				monogram,
				{ autoAlpha: 0, scale: 0.5, rotate: -8 },
				{ autoAlpha: 1, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.6)' },
			)
		}
		if (wordmark) {
			tl.fromTo(
				wordmark,
				{ autoAlpha: 0, y: 28 },
				{ autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' },
				monogram ? '-=0.25' : 0,
			)
		}
	}

	function initScene() {
		if (PREFERS_REDUCED.matches) return

		const mm = gsap.matchMedia()

		mm.add('(max-width: 991px)', () => {
			const ctx = gsap.context(() => {
				testimonialsReveal()
				footerBrandReveal()
			})
			return () => ctx.revert()
		})

		mm.add('(min-width: 992px)', () => {
			const ctx = gsap.context(() => {
				testimonialsReveal()
				footerBrandReveal()
			})
			return () => ctx.revert()
		})
	}

	PREFERS_REDUCED.addEventListener('change', () => {
		for (const st of ScrollTrigger.getAll()) {
			const t = st.vars.trigger
			if (t === testimonialsSection || footer?.contains(t)) {
				st.kill()
			}
		}
		initScene()
		ScrollTrigger.refresh()
	})

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initScene)
	} else {
		initScene()
	}
})()
