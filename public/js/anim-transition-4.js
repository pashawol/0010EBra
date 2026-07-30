/**
 * Transition 4 — раскадровка Figma (576:2 → 602:805 … 602:1148, 4 шага).
 *
 * Что показывает раскадровка (см. docs/coordination/anim-t45.md за подробным
 * разбором кадров): между статичным финалом sQuiz («4 вопроса» / кнопка
 * «Подобрать с ИИ» — узел Frame 744, в коде — .sQuiz__panel) и статичным
 * стартом sPromo (три карточки-баннера .sPromo__card) происходит обычный
 * непрерывный скролл документа — метаданные Figma показывают, что все слои
 * (панель квиза, промо-баннеры и декоративный текст «Sale», который в коде
 * не существует — см. заявку в координации) двигаются с ОДНИМ и тем же шагом
 * между кадрами. Значит, никакого пина и никакого относительного параллакса
 * между секциями дизайнер не закладывал — это разметка обычного скролла.
 *
 * Что добавляет эта сцена поверх «голого» скролла (раз он и так «прозрачен»):
 * 1. Панель квиза (.sQuiz__panel) слегка «тает» при выходе из вьюпорта —
 *    задел на закрытие секции, а не обрыв кадра.
 * 2. Карточки sPromo (.sPromo__card) появляются с лёгким подъёмом и
 *    stagger-задержкой (верхняя карточка первой, две нижние — следом) —
 *    иначе три full-bleed баннера просто «щёлкают» в кадр при обычном
 *    reveal-on-enter из anim.js (он их не покрывает: у sPromo нет
 *    .eb-title/.eb-fact, только собственная .card-title/.card-text).
 *
 * Архитектура — по конвенции anim.js (см. source/js/anim.js, не редактируется
 * в этой задаче): gsap.context на каждую сцену, gsap.matchMedia() вместо
 * ветвлений по innerWidth, prefers-reduced-motion выключает сцену целиком,
 * стартовое состояние ставится из JS (без анимации — контент в разметке
 * виден полностью).
 */
;(() => {
	const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
	gsap.registerPlugin(ScrollTrigger)

	const quizSection = document.getElementById('sQuiz')
	const promoSection = document.getElementById('sPromo')
	// Ни одна из двух секций не отрендерена (например, dev-стенд отдельного
	// блока) — сцене нечего анимировать, оставляем контент как есть.
	if (!quizSection && !promoSection) return

	/**
	 * Панель-аутро квиза («4 вопроса» + «Подобрать с ИИ») слегка гаснет по
	 * мере того, как секция уходит вверх за пределы экрана — привязано к
	 * прогрессу скролла (scrub), поэтому реверсируется при скролле назад и
	 * никогда не прячет контент насовсем (autoAlpha не опускается ниже 0.35).
	 */
	function quizOutro() {
		if (!quizSection) return
		const panel = quizSection.querySelector('.sQuiz__panel')
		if (!panel) return

		gsap.fromTo(
			panel,
			{ autoAlpha: 1, y: 0 },
			{
				autoAlpha: 0.35,
				y: -28,
				ease: 'none',
				scrollTrigger: {
					trigger: quizSection,
					start: 'bottom 78%',
					end: 'bottom 15%',
					scrub: 0.4,
				},
			},
		)
	}

	/**
	 * Карточки sPromo появляются по одной: сначала верхняя full-width
	 * («week»), затем — с небольшим сдвигом по времени — две нижние
	 * («gift», «outlet»), как в порядке чтения раскадровки (шаги 3→4).
	 */
	function promoStagger() {
		if (!promoSection) return
		const cards = [
			...promoSection.querySelectorAll('.sPromo__row--top .sPromo__card'),
			...promoSection.querySelectorAll('.sPromo__row--bottom .sPromo__card'),
		]
		if (!cards.length) return

		gsap.fromTo(
			cards,
			{ autoAlpha: 0, y: 56 },
			{
				autoAlpha: 1,
				y: 0,
				duration: 0.9,
				ease: 'power2.out',
				stagger: 0.18,
				scrollTrigger: {
					trigger: promoSection,
					start: 'top 82%',
					once: true,
				},
			},
		)
	}

	function initScene() {
		if (PREFERS_REDUCED.matches) return

		const mm = gsap.matchMedia()

		// Мобильные: только появление карточек, без scrub-затухания панели —
		// scrub-сцены на слабых устройствах дают рваный скролл (правило
		// anim.js/PLAN §6), да и панель квиза на мобилке и так короткая.
		mm.add('(max-width: 991px)', () => {
			const ctx = gsap.context(() => {
				promoStagger()
			})
			return () => ctx.revert()
		})

		mm.add('(min-width: 992px)', () => {
			const ctx = gsap.context(() => {
				quizOutro()
				promoStagger()
			})
			return () => ctx.revert()
		})
	}

	// Смена prefers-reduced-motion на живой странице — пересоздаём сцену.
	// Общий ScrollTrigger.refresh() после загрузки шрифтов/картинок делает
	// anim.js (правило §6 плана), здесь достаточно не мешать этому вызову.
	PREFERS_REDUCED.addEventListener('change', () => {
		for (const st of ScrollTrigger.getAll()) {
			if (st.vars.trigger === quizSection || st.vars.trigger === promoSection) st.kill()
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
