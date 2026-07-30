/**
 * Drag-компаратор «до/после» для sStory.
 *
 * Независим от Swiper: внешний слайдер (см. common.js → initDataSwipers)
 * листает ИСТОРИИ, а этот модуль двигает границу «до/после» ВНУТРИ каждого
 * отдельного слайда. Один экземпляр на `[data-story-compare]`, слайдов
 * может быть несколько одновременно в DOM (loop клонирует их) — поэтому
 * инициализация идёт по querySelectorAll, а не по одному узлу.
 *
 * Ручке (`.sStory__handle-btn`) добавлен класс `swiper-no-swiping` в разметке:
 * без него Swiper перехватывает pointerdown на слайде и вместо сдвига
 * границы листает историю — грабля, а не «дефолт можно оставить».
 */

const MIN_PERCENT = 0
const MAX_PERCENT = 100
const KEYBOARD_STEP = 5

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function percentFromClientX(container, clientX) {
	const rect = container.getBoundingClientRect()
	if (rect.width === 0) return 0
	const ratio = (clientX - rect.left) / rect.width
	return clamp(ratio * 100, MIN_PERCENT, MAX_PERCENT)
}

function initCompare(container) {
	const handle = container.querySelector('.sStory__handle')
	const handleBtn = container.querySelector('.sStory__handle-btn')
	if (!handle || !handleBtn) return

	const initial = Number.parseFloat(container.dataset.split || '30')
	let current = Number.isFinite(initial) ? clamp(initial, MIN_PERCENT, MAX_PERCENT) : 30

	function setSplit(percent) {
		current = clamp(percent, MIN_PERCENT, MAX_PERCENT)
		container.style.setProperty('--split', `${current}%`)
		handleBtn.setAttribute('aria-valuenow', String(Math.round(current)))
	}

	function onPointerMove(event) {
		setSplit(percentFromClientX(container, event.clientX))
	}

	function onPointerUp(event) {
		handleBtn.releasePointerCapture?.(event.pointerId)
		document.removeEventListener('pointermove', onPointerMove)
		document.removeEventListener('pointerup', onPointerUp)
	}

	function onPointerDown(event) {
		// Не даём Swiper и браузерному скроллу перехватить жест — это тот же
		// самый компаратор, который должен реагировать только на своё перетаскивание.
		event.preventDefault()
		event.stopPropagation()
		handleBtn.setPointerCapture?.(event.pointerId)
		setSplit(percentFromClientX(container, event.clientX))
		document.addEventListener('pointermove', onPointerMove)
		document.addEventListener('pointerup', onPointerUp)
	}

	function onKeyDown(event) {
		let next = null
		if (event.key === 'ArrowLeft') next = current - KEYBOARD_STEP
		else if (event.key === 'ArrowRight') next = current + KEYBOARD_STEP
		else if (event.key === 'Home') next = MIN_PERCENT
		else if (event.key === 'End') next = MAX_PERCENT
		if (next === null) return
		event.preventDefault()
		setSplit(next)
	}

	handleBtn.addEventListener('pointerdown', onPointerDown)
	handleBtn.addEventListener('keydown', onKeyDown)

	setSplit(current)
}

function initAllCompares() {
	for (const container of document.querySelectorAll('[data-story-compare]')) {
		initCompare(container)
	}
}

if (document.readyState !== 'loading') {
	initAllCompares()
} else {
	document.addEventListener('DOMContentLoaded', initAllCompares)
}
