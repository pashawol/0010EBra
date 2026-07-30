/**
 * Табы-фильтры sBestSets («Лучшие наборы белья», node 384:633).
 *
 * Стандартный WAI-ARIA tabs pattern: все 5 панелей (наборов карточек) уже
 * лежат в разметке (данные — source/pug/data/sBestSets.json), неактивные
 * скрыты нативным `hidden`. Клик/клавиатура только переключают
 * `aria-selected`/`tabindex` на кнопках и `hidden` на панелях — сеть и
 * перерисовка карточек не нужны, поэтому переключение мгновенное и работает
 * без сети.
 *
 * Независим от Swiper и других блоков: подключается через
 * `[data-swiper-options]`-подобный самодостаточный querySelectorAll,
 * инициализация ищет свои узлы и ничего не делает, если их нет на странице.
 */

function activateTab(tabButtons, panels, targetButton, { moveFocus = false } = {}) {
	const targetId = targetButton.dataset.tab

	for (const button of tabButtons) {
		const isTarget = button === targetButton
		button.setAttribute('aria-selected', isTarget ? 'true' : 'false')
		button.tabIndex = isTarget ? 0 : -1
	}

	for (const panel of panels) {
		const isTarget = panel.dataset.tabPanel === targetId
		panel.hidden = !isTarget
	}

	if (moveFocus) targetButton.focus()
}

function initBestSetsTabs(root) {
	const tablist = root.querySelector('.sBestSets__tabs')
	if (!tablist) return

	const tabButtons = Array.from(tablist.querySelectorAll('.sBestSets__tab'))
	const panels = Array.from(root.querySelectorAll('.sBestSets__panel'))
	if (tabButtons.length === 0 || panels.length === 0) return

	for (const button of tabButtons) {
		button.addEventListener('click', () => {
			if (button.getAttribute('aria-selected') === 'true') return
			activateTab(tabButtons, panels, button)
		})

		button.addEventListener('keydown', (event) => {
			const currentIndex = tabButtons.indexOf(button)
			let nextIndex = null

			switch (event.key) {
				case 'ArrowRight':
				case 'ArrowDown':
					nextIndex = (currentIndex + 1) % tabButtons.length
					break
				case 'ArrowLeft':
				case 'ArrowUp':
					nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length
					break
				case 'Home':
					nextIndex = 0
					break
				case 'End':
					nextIndex = tabButtons.length - 1
					break
				default:
					return
			}

			event.preventDefault()
			activateTab(tabButtons, panels, tabButtons[nextIndex], { moveFocus: true })
		})
	}
}

function initAllBestSets() {
	for (const root of document.querySelectorAll('.sBestSets')) {
		initBestSetsTabs(root)
	}
}

if (document.readyState !== 'loading') {
	initAllBestSets()
} else {
	document.addEventListener('DOMContentLoaded', initAllBestSets)
}
