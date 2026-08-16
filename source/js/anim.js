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
	// Без GSAP страница обязана остаться рабочей: слой просто не включается.
	if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

	gsap.registerPlugin(ScrollTrigger)

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

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', refreshWhenReady)
	} else {
		refreshWhenReady()
	}
})()
