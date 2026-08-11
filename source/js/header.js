/**
 * Header + catalog popup (318:527 desktop bar / 41:14,41:72,41:156 desktop
 * menu states / 41:223 hover subcategory panel).
 * Vanilla JS, no jQuery — per task scope. Handles:
 *  - open/close of #catalogModal — desktop only: both the burger and the
 *    "Каталог" pill open the SAME popup (level1 = category list + general
 *    links, level2 = hover-expand with subcategory cards). On mobile the
 *    burger opens #mobileMenu instead (source/js/mobile-menu.js) — this
 *    module ignores burger clicks below the lg breakpoint.
 *  - focus trap + Escape + backdrop click
 *  - desktop: hover/focus on a level1 category swaps the level2 panel and
 *    grows the dialog width (.--peek, 41:156→41:223); mouseleave on the
 *    body collapses it back to level1
 *  - mobile: click drill-down into level2, with a "back" button to level1
 *
 * NOTE: scroll-driven `.top-nav.fixed` background toggle is NOT handled here —
 * that's already done by the shared window scroll listener in source/js/common.js
 * calling JSCCommon.setFixedNav() (source/js/JSCCommon.js), which looks up
 * `.top-nav` and toggles `.fixed` on scrollY > 0. Not touched, not duplicated.
 */
;(() => {
	const MODAL_SELECTOR = '#catalogModal'
	const OPEN_SELECTOR = '[data-catalog-open]'
	const CLOSE_SELECTOR = '[data-catalog-close]'
	const BACK_SELECTOR = '[data-catalog-back]'
	const ITEM_TRIGGER_SELECTOR = '.catalog-modal__item-link[data-catalog-trigger]'
	const PANEL_SELECTOR = '.catalog-modal__panel'
	const DESKTOP_QUERY = '(min-width: 992px)' // совпадает с $grid-breakpoints.lg
	// Бургер — двойного назначения (см. _top-nav.pug): на мобилке им управляет
	// mobile-menu.js (#mobileMenu), этот модуль должен его игнорировать на
	// мобилке, иначе клик открыл бы ОБА попапа разом.
	const BURGER_SELECTOR = '.top-nav__burger'
	const FOCUSABLE_SELECTOR =
		'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

	const modal = document.querySelector(MODAL_SELECTOR)
	if (!modal) return

	const list = modal.querySelector('.catalog-modal__list')
	const panelsWrap = modal.querySelector('.catalog-modal__panels')
	const openTriggers = document.querySelectorAll(OPEN_SELECTOR)
	let lastFocused = null
	let hideTimer = null

	const isDesktopViewport = () => window.matchMedia(DESKTOP_QUERY).matches

	function setActivePanel(index) {
		if (!panelsWrap) return
		for (const panel of panelsWrap.querySelectorAll(PANEL_SELECTOR)) {
			panel.classList.toggle('--active', panel.getAttribute('data-catalog-panel') === String(index))
		}
	}

	function setActiveItem(index) {
		if (!list) return
		for (const link of list.querySelectorAll(ITEM_TRIGGER_SELECTOR)) {
			const isActive = link.getAttribute('data-catalog-trigger') === String(index)
			link.classList.toggle('--active', isActive)
			link.setAttribute('aria-expanded', String(isActive))
		}
	}

	function setTriggersExpanded(expanded) {
		for (const trigger of openTriggers) {
			trigger.setAttribute('aria-expanded', String(expanded))
		}
	}

	function activateCategory(index) {
		setActiveItem(index)
		setActivePanel(index)
		// level1 → level2 (41:156 → 41:223): плашка растягивается под панель
		// с подкатегориями, transition на width висит на &__dialog (0.2s).
		modal.classList.add('--peek')
	}

	function deactivateCategory() {
		setActiveItem(null)
		setActivePanel(null)
		modal.classList.remove('--peek')
	}

	function getFocusable() {
		const nodes = modal.querySelectorAll(FOCUSABLE_SELECTOR)
		// offsetParent === null отсекает элементы, скрытые в неактивной (ещё не
		// drill-down-нутой на мобилке) панели — иначе Tab уводит фокус в
		// невидимый level2, которого пользователь ещё не видит.
		return Array.from(nodes).filter((node) => node.offsetParent !== null)
	}

	function onKeydown(event) {
		if (event.key === 'Escape' || event.key === 'Esc') {
			event.preventDefault()
			closeModal()
			return
		}
		if (event.key !== 'Tab') return

		const focusable = getFocusable()
		if (focusable.length === 0) {
			event.preventDefault()
			return
		}
		const first = focusable[0]
		const last = focusable[focusable.length - 1]

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault()
			first.focus()
		} else if (!focusable.includes(document.activeElement)) {
			// Фокус каким-то образом вышел за пределы попапа (напр. программно) —
			// возвращаем его внутрь, а не отпускаем на страницу под попапом.
			event.preventDefault()
			first.focus()
		}
	}

	function openModal(trigger) {
		lastFocused = trigger || document.activeElement
		if (hideTimer) {
			window.clearTimeout(hideTimer)
			hideTimer = null
		}
		modal.hidden = false
		// Форсируем reflow до добавления класса — иначе браузер схлопывает
		// hidden→visible и transition, добавленный в этом же тике, не проиграется.
		void modal.offsetWidth
		modal.classList.add('--open')
		document.body.classList.add('catalog-modal-open')
		setTriggersExpanded(true)

		const closeBtn = modal.querySelector(CLOSE_SELECTOR)
		;(closeBtn || modal).focus({ preventScroll: true })

		document.addEventListener('keydown', onKeydown, true)
	}

	function closeModal() {
		if (modal.hidden) return
		modal.classList.remove('--open')
		document.body.classList.remove('catalog-modal-open')
		setTriggersExpanded(false)
		document.removeEventListener('keydown', onKeydown, true)

		hideTimer = window.setTimeout(() => {
			modal.hidden = true
			// Возвращаем попап на level1 к следующему открытию.
			modal.classList.remove('--drilled')
			deactivateCategory()
			hideTimer = null
		}, 320)

		if (lastFocused && typeof lastFocused.focus === 'function') {
			lastFocused.focus({ preventScroll: true })
		}
	}

	document.addEventListener('click', (event) => {
		const opener = event.target.closest(OPEN_SELECTOR)
		if (opener) {
			if (opener.matches(BURGER_SELECTOR) && !isDesktopViewport()) {
				// Мобилка: бургер открывает #mobileMenu (mobile-menu.js), этот
				// попап на этом брейкпоинте не трогаем.
				return
			}
			event.preventDefault()
			openModal(opener)
			return
		}

		if (modal.hidden) return

		if (event.target.closest(CLOSE_SELECTOR)) {
			event.preventDefault()
			closeModal()
			return
		}

		if (event.target.closest(BACK_SELECTOR)) {
			event.preventDefault()
			modal.classList.remove('--drilled')
			return
		}

		const trigger = event.target.closest(ITEM_TRIGGER_SELECTOR)
		if (trigger) {
			if (!isDesktopViewport()) {
				// Мобилка: клик по категории с подменю — drill-down в level2,
				// а не переход по заглушке `#`.
				event.preventDefault()
				activateCategory(trigger.getAttribute('data-catalog-trigger'))
				modal.classList.add('--drilled')
			}
			return
		}

		// Любая другая ссылка внутри попапа (лист без подменю, карточка в level2-
		// панели) — это выбор конечного пункта каталога: закрываем попап, чтобы
		// не оставлять его "открытым мёртвым грузом" поверх страницы.
		const leafLink = event.target.closest(
			'.catalog-modal__item-link:not([data-catalog-trigger]), .catalog-modal__panel-card',
		)
		if (leafLink) {
			closeModal()
		}
	})

	// Десктоп: hover/focus по категории с подменю переключает панель без клика
	// (609:4165 — состояние hover в UI-Kit).
	if (list) {
		list.addEventListener('mouseover', (event) => {
			if (!isDesktopViewport()) return
			const trigger = event.target.closest(ITEM_TRIGGER_SELECTOR)
			if (!trigger) return
			activateCategory(trigger.getAttribute('data-catalog-trigger'))
		})

		list.addEventListener(
			'focusin',
			(event) => {
				if (!isDesktopViewport()) return
				const trigger = event.target.closest(ITEM_TRIGGER_SELECTOR)
				if (!trigger) return
				activateCategory(trigger.getAttribute('data-catalog-trigger'))
			},
			true,
		)
	}

	// Уход мыши со всей области (список + панель) — level2 сворачивается
	// обратно в level1 (41:223 → 41:156). Вешаем на __body, а не на __list:
	// перемещение курсора из списка в панель справа не должно считаться
	// «ушёл», это одна и та же наведённая зона.
	const body = modal.querySelector('.catalog-modal__body')
	if (body) {
		body.addEventListener('mouseleave', () => {
			if (!isDesktopViewport()) return
			deactivateCategory()
		})
	}

	// Resize с мобилки на десктоп во время открытого попапа: сбрасываем
	// drill-down, иначе на десктопе останется "залипший" transform level2-панели.
	window.addEventListener(
		'resize',
		() => {
			if (!modal.hidden && isDesktopViewport()) {
				modal.classList.remove('--drilled')
			}
		},
		{ passive: true },
	)
})()
