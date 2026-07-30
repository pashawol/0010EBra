/**
 * Transition 2 — «Кому помогает Esthetic Bra» (#sAudience) → «Подбор
 * идеального варианта» (#sFitting).
 *
 * Раскадровка (Figma, страница Scroll Animation `576:2`):
 *   step 1 `576:553` — #sFitting ещё полностью ниже вьюпорта, видна только
 *     мозаика #sAudience.
 *   step 2 `599:267` — #sFitting уже частично в кадре и нарисована как
 *     скруглённая "карточка", вписанная в вьюпорт с равномерным отступом
 *     (в Figma-метаданных её фон-прямоугольник имеет inset 45px на step 1
 *     entry point и 25px на этом шаге вместо 0), пока #sAudience уезжает
 *     вверх.
 *   step 3 `599:347` — #sFitting уже на месте: fон-прямоугольник занимает
 *     ровно 1920×1080 без отступа и без скругления — секция стала обычной
 *     full-bleed полосой.
 *
 * Итог: секция не появляется рывком, а "распахивается" из скруглённой карточки
 * до полноэкранной полосы по мере того, как её верхний край проходит путь от
 * низа вьюпорта до верха. Инфраструктуру (matchMedia/context/reduced-motion)
 * не переизобретаю — паттерн 1:1 с `source/js/anim.js`, который не трогаю.
 *
 * Эффект собран через clip-path на самой секции: это не требует нового хука
 * в разметке (секция уже существует, `#sFitting`) и не хардкодит цвет —
 * скругление/отступ геометрические, участвующих цветов в таймлайне нет.
 */
;(() => {
	const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

	gsap.registerPlugin(ScrollTrigger)

	/**
	 * @param {number} insetPx   стартовый равномерный отступ карточки
	 * @param {number} radiusPx  стартовое скругление углов карточки
	 */
	function buildScene(insetPx, radiusPx) {
		const section = document.querySelector('#sFitting')
		if (!section) return () => {}

		const ctx = gsap.context(() => {
			gsap.fromTo(
				section,
				{ clipPath: `inset(${insetPx}px round ${radiusPx}px)` },
				{
					clipPath: 'inset(0px round 0px)',
					// scrub без собственного ease: значение обязано быть жёстко
					// привязано к позиции скролла (карточка "хватается" пальцем),
					// сглаживание добавляет только сам scrub (число секунд ниже).
					ease: 'none',
					scrollTrigger: {
						trigger: section,
						start: 'top bottom',
						end: 'top top',
						scrub: 0.3,
					},
				},
			)
		})

		return () => ctx.revert()
	}

	function initScene() {
		if (PREFERS_REDUCED.matches) return () => {}

		const mm = gsap.matchMedia()

		mm.add('(max-width: 991.98px)', () => buildScene(20, 16))
		mm.add('(min-width: 992px)', () => buildScene(46, 30))

		return () => mm.revert()
	}

	let teardown = () => {}

	function start() {
		teardown()
		teardown = initScene()
	}

	// Смена prefers-reduced-motion на живой странице — убираем/включаем сцену
	// так же, как это делает anim.js для своих собственных сценариев.
	PREFERS_REDUCED.addEventListener('change', start)

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start)
	} else {
		start()
	}
})()
