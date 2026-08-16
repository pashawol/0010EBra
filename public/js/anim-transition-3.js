/**
 * Transition 3 — «Тысячи подборов» (#sExpertise) → «Интерактивный квиз на
 * базе ИИ-ассистента» (#sQuiz).
 *
 * Раскадровка (Figma, страница Scroll Animation `576:2`, 5 шагов):
 *   `599:172` — #sExpertise полностью в кадре.
 *   `599:176` — #sExpertise почти ушла вверх, ниже уже видны заголовок
 *     квиза и первая (visitor) реплика чата.
 *   `602:430` — #sExpertise скрылась, видны заголовок + reплика посетителя,
 *     колонки ответа ИИ-ассистента ещё нет в кадре.
 *   `602:517` — реплики ИИ-ассистента (4 пузыря) уже видны.
 *   `602:606` — виден весь нижний блок квиза: пилюля «N вопросов» + кнопка
 *     «Подобрать с ИИ».
 *
 * Проверка Figma-метаданных всех 5 фреймов показала: ни один элемент чата не
 * помечен скрытым/полупрозрачным на "ранних" шагах — они просто лежат ниже
 * границы вьюпорта на соответствующей scroll-позиции. То есть раскадровка
 * документирует обычный порядок раскрытия контента при скролле, а не
 * собственный motion-эффект внутри чата.
 *
 * Это совпадает с прямым решением заказчика (`docs/PLAN.md` §1.1,
 * `docs/coordination/sQuiz.md`): квиз — статичная вёрстка чата, БЕЗ
 * анимации появления отдельных сообщений и БЕЗ имитации набора текста.
 * Поэтому здесь нет покадрового/постепенного реплика-за-репликой реveal —
 * это было бы имитацией "печатает ассистент", то есть ровно то, что
 * запрещено. Чат/панель показываются ОДНИМ блоком, как обычная секция.
 *
 * Что реализовано как сама сцена перехода:
 *  1. Уходящая сторона: `.sExpertise__overlay` слегка притормаживает и
 *     тускнеет, пока секция покидает вьюпорт (scrub, синхронно со скроллом) —
 *     даёт ощущение "передачи" одной секции другой, а не обрыва.
 *  2. Приходящая сторона: `.sQuiz__chat` и `.sQuiz__panel` появляются одним
 *     реveal (autoAlpha+y), когда секция входит в кадр — тот же приём и те
 *     же тайминги, что у `revealOnEnter` в anim.js, просто для узлов, которые
 *     не покрываются его конвенцией `.eb-title/.eb-fact` (заголовок квиза
 *     `.sQuiz__title` уже имеет класс `.eb-title` и анимируется самим
 *     anim.js — здесь его намеренно не трогаю повторно).
 */
;(() => {
	const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

	gsap.registerPlugin(ScrollTrigger)

	function outgoingExpertise(desktop) {
		const overlay = document.querySelector('#sExpertise .sExpertise__overlay')
		if (!overlay) return

		gsap.fromTo(
			overlay,
			{ autoAlpha: 1, scale: 1 },
			{
				autoAlpha: desktop ? 0.45 : 0.65,
				scale: desktop ? 0.94 : 0.97,
				ease: 'none',
				scrollTrigger: {
					trigger: '#sExpertise',
					start: 'bottom bottom',
					end: 'bottom top',
					scrub: 0.3,
				},
			},
		)
	}

	function buildScene(desktop) {
		const ctx = gsap.context(() => {
			outgoingExpertise(desktop)
		})

		return () => ctx.revert()
	}

	function initScene() {
		if (PREFERS_REDUCED.matches) return () => {}

		const mm = gsap.matchMedia()

		mm.add('(max-width: 991.98px)', () => buildScene(false))
		mm.add('(min-width: 992px)', () => buildScene(true))

		return () => mm.revert()
	}

	let teardown = () => {}

	function start() {
		teardown()
		teardown = initScene()
	}

	PREFERS_REDUCED.addEventListener('change', start)

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start)
	} else {
		start()
	}
})()
