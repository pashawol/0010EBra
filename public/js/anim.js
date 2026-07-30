/**
 * Анимационный слой Esthetic Bra.
 *
 * Инфраструктуры для GSAP в проектах студии не было ни в одном репозитории:
 * где GSAP использовался, сценарии писались per-page без cleanup, мобилка
 * разводилась ветвлениями по window.innerWidth, а prefers-reduced-motion
 * не встречался вообще. Поэтому слой спроектирован здесь с нуля, и правила у
 * него жёсткие:
 *
 * 1. Стартовое состояние задаёт JS, а не CSS. Если скрипт не выполнился или
 *    пользователь просит меньше движения — контент виден полностью. Анимация
 *    не имеет права прятать контент навсегда.
 * 2. Разведение по ширине — через gsap.matchMedia(), а не по innerWidth:
 *    matchMedia сам создаёт и убивает контекст на смене брейкпоинта.
 *    ScrollTrigger.matchMedia() устарел с GSAP 3.11 и здесь не используется.
 * 3. Пересчёт триггеров — после загрузки шрифтов и картинок. Позиции start/end
 *    считаются от геометрии, а она до декодирования картинок другая.
 */

;(() => {
	const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

	// Без GSAP страница обязана остаться рабочей: слой просто не включается.
	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

	gsap.registerPlugin(ScrollTrigger)

	/**
	 * Плавное появление секции при входе во вьюпорт.
	 * Стартовое состояние ставится из JS перед созданием таймлайна — в CSS его
	 * нет специально, иначе при неработающем JS блок остался бы невидимым.
	 */
	function revealOnEnter(scope) {
		// Цели задаются соглашением, а не разметкой в каждом блоке: заголовки
		// секций и блоки фактов есть почти везде, и помечать их атрибутом руками
		// в 18 блоках — лишний источник расхождений. Явный [data-anim] остаётся
		// для точечных случаев.
		const explicit = [...scope.querySelectorAll('[data-anim="reveal"]')]

		// Первая секция исключена намеренно: её заголовок — LCP-элемент,
		// прятать его на старте нельзя.
		const firstSection = scope.querySelector('main > section')
		const byConvention = [...scope.querySelectorAll('.eb-title, .eb-fact')].filter(
			(el) => !firstSection || !firstSection.contains(el),
		)

		const targets = [...new Set([...explicit, ...byConvention])]
		if (!targets.length) return

		for (const el of targets) {
			gsap.fromTo(
				el,
				{ autoAlpha: 0, y: 32 },
				{
					autoAlpha: 1,
					y: 0,
					duration: 0.8,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: el,
						start: 'top 85%',
						once: true,
					},
				},
			)
		}
	}

	/**
	 * Параллакс фонового фото внутри секции: фон едет медленнее контента.
	 * Пин не используется — на секциях со Swiper пин конфликтует с его
	 * transform, а без пина эффект достигается сдвигом самой картинки.
	 */
	function parallaxMedia(scope) {
		const targets = scope.querySelectorAll('[data-anim="parallax"]')
		if (!targets.length) return

		for (const el of targets) {
			gsap.fromTo(
				el,
				{ yPercent: -6 },
				{
					yPercent: 6,
					ease: 'none',
					scrollTrigger: {
						trigger: el.closest('section') || el,
						start: 'top bottom',
						end: 'bottom top',
						scrub: true,
					},
				},
			)
		}
	}

	function initAnimations() {
		// Уважение к системной настройке: контент сразу в финальном состоянии.
		if (PREFERS_REDUCED.matches) return

		const mm = gsap.matchMedia()

		// Мобильные: только появление, никаких скраб-сценариев — на слабых
		// устройствах они дают рваный скролл.
		mm.add('(max-width: 991px)', () => {
			const ctx = gsap.context(() => {
				revealOnEnter(document)
			})
			return () => ctx.revert()
		})

		mm.add('(min-width: 992px)', () => {
			const ctx = gsap.context(() => {
				revealOnEnter(document)
				parallaxMedia(document)
			})
			return () => ctx.revert()
		})
	}

	/**
	 * Пересчёт после того, как шрифты и картинки реально загрузились:
	 * до этого геометрия другая и start/end уезжают.
	 */
	function refreshWhenReady() {
		const done = () => ScrollTrigger.refresh()

		if (document.fonts?.ready) {
			document.fonts.ready.then(done)
		}

		window.addEventListener('load', done, { once: true })
	}

	// Смена системной настройки на живой странице: снимаем или включаем движение
	// без перезагрузки.
	PREFERS_REDUCED.addEventListener('change', () => {
		for (const st of ScrollTrigger.getAll()) st.kill()
		gsap.globalTimeline.clear()
		initAnimations()
		ScrollTrigger.refresh()
	})

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			initAnimations()
			refreshWhenReady()
		})
	} else {
		initAnimations()
		refreshWhenReady()
	}
})()
