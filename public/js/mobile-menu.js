/**
 * Vanilla JS, без jQuery — логика по образцу `.catalog-modal` из 0041-asko
 * (`sourse/js/common.js` + `JSCCommon.js`), переписана без jQuery/классов-«--js».
 * Контракт с внешним миром (шапка — чужая зона, см. docs/coordination/mobileMenu.md):
 * любой элемент с [data-mobile-menu-toggle] открывает/закрывает меню и получает
 * актуальный aria-expanded. Сам компонент ничего не знает о разметке шапки.
 * Экраны переключаются атрибутом [hidden] — скрытый экран одновременно не
 * рендерится, недоступен axe и не ловит фокус/Tab, отдельный focus-trap на
 * подэкран не нужен (грабля «в DOM есть, но не видно» здесь неприменима:
 * скрытое реально не в дереве).
 */
;(function () {
	var MENU_ID = 'mobileMenu'
	var OPEN_SELECTOR = '[data-mobile-menu-toggle]'
	var ROOT_SCREEN = 'root'
	var OVERLAY_EVENT = 'eb:overlay-open'
	var OPEN_CLASS = '--open'
	var ANIM_FORWARD = '--anim-forward'
	var ANIM_BACK = '--anim-back'
	var MENU_ANIM_MS = 280

	var menu = null
	var lastFocused = null
	var closeTimer = null
	var scrollLockPadding = ''

	function qsa(selector, ctx) {
		return Array.prototype.slice.call((ctx || document).querySelectorAll(selector))
	}

	function getMenu() {
		if (!menu) menu = document.getElementById(MENU_ID)
		return menu
	}

	function focusableElements(container) {
		return qsa(
			'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
			container,
		).filter(function (el) {
			return el.offsetParent !== null || el === document.activeElement
		})
	}

	function setTogglesExpanded(expanded) {
		qsa(OPEN_SELECTOR).forEach(function (toggle) {
			toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false')
		})
	}

	function lockScroll() {
		var scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
		scrollLockPadding = document.body.style.paddingRight
		if (scrollBarWidth > 0) {
			document.body.style.paddingRight = scrollBarWidth + 'px'
		}
		document.body.classList.add('mobileMenu-scroll-lock')
		document.documentElement.classList.add('mobileMenu-scroll-lock')
	}

	function unlockScroll() {
		document.body.classList.remove('mobileMenu-scroll-lock')
		document.documentElement.classList.remove('mobileMenu-scroll-lock')
		document.body.style.paddingRight = scrollLockPadding
	}

	function showScreen(root, name, direction) {
		qsa('[data-menu-screen]', root).forEach(function (screen) {
			var isTarget = screen.getAttribute('data-menu-screen') === name
			screen.hidden = !isTarget
			screen.classList.remove(ANIM_FORWARD, ANIM_BACK)
			if (isTarget && direction) {
				void screen.offsetWidth
				screen.classList.add(direction === 'back' ? ANIM_BACK : ANIM_FORWARD)
			}
		})
		qsa('[data-menu-open]', root).forEach(function (trigger) {
			trigger.setAttribute(
				'aria-expanded',
				trigger.getAttribute('data-menu-open') === name ? 'true' : 'false',
			)
		})
	}

	function openMenu(triggerEl) {
		var root = getMenu()
		if (!root) return
		document.dispatchEvent(new CustomEvent(OVERLAY_EVENT, { detail: { id: MENU_ID } }))
		if (closeTimer) {
			window.clearTimeout(closeTimer)
			closeTimer = null
		}
		lastFocused = triggerEl || document.activeElement
		root.hidden = false
		showScreen(root, ROOT_SCREEN)
		void root.offsetWidth
		root.classList.add(OPEN_CLASS)
		lockScroll()
		setTogglesExpanded(true)

		var closeBtn = root.querySelector('[data-menu-close]:not(.mobileMenu__backdrop)')
		if (closeBtn) closeBtn.focus()
	}

	function closeMenu() {
		var root = getMenu()
		if (!root || root.hidden || closeTimer) return
		root.classList.remove(OPEN_CLASS)
		closeTimer = window.setTimeout(function () {
			root.hidden = true
			showScreen(root, ROOT_SCREEN)
			closeTimer = null
		}, MENU_ANIM_MS)
		unlockScroll()
		setTogglesExpanded(false)

		if (lastFocused && typeof lastFocused.focus === 'function') {
			lastFocused.focus()
		}
		lastFocused = null
	}

	function toggleMenu(triggerEl) {
		var root = getMenu()
		if (!root) return
		if (root.hidden) {
			openMenu(triggerEl)
		} else {
			closeMenu()
		}
	}

	function trapFocus(event) {
		var root = getMenu()
		if (!root || root.hidden || event.key !== 'Tab') return

		var currentScreen = qsa('[data-menu-screen]', root).filter(function (screen) {
			return !screen.hidden
		})[0]
		var focusable = focusableElements(currentScreen || root)
		if (!focusable.length) return

		var first = focusable[0]
		var last = focusable[focusable.length - 1]

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault()
			first.focus()
		}
	}

	function onClick(event) {
		var toggle = event.target.closest(OPEN_SELECTOR)
		if (toggle) {
			event.preventDefault()
			toggleMenu(toggle)
			return
		}

		var root = getMenu()
		if (!root || root.hidden) return

		if (event.target.closest('[data-menu-close]')) {
			event.preventDefault()
			closeMenu()
			return
		}

		var openTrigger = event.target.closest('[data-menu-open]')
		if (openTrigger) {
			event.preventDefault()
			showScreen(root, openTrigger.getAttribute('data-menu-open'), 'forward')
			var screen = root.querySelector(
				'[data-menu-screen="' + openTrigger.getAttribute('data-menu-open') + '"]',
			)
			var heading = screen?.querySelector('.mobileMenu__breadcrumb-name')
			if (heading) {
				heading.setAttribute('tabindex', '-1')
				heading.focus()
			}
			return
		}

		if (event.target.closest('[data-menu-back]')) {
			event.preventDefault()
			showScreen(root, ROOT_SCREEN, 'back')
		}
	}

	function onKeydown(event) {
		var root = getMenu()
		if (!root || root.hidden) return

		if (event.key === 'Escape') {
			event.preventDefault()
			closeMenu()
			return
		}

		trapFocus(event)
	}

	function onResize() {
		var root = getMenu()
		if (!root || root.hidden) return
		if (window.matchMedia('(min-width: 992px)').matches) showScreen(root, ROOT_SCREEN)
	}

	function onOverlayOpen(event) {
		if (event.detail && event.detail.id !== MENU_ID) closeMenu()
	}

	function init() {
		if (!getMenu()) return
		document.addEventListener(OVERLAY_EVENT, onOverlayOpen)
		document.addEventListener('click', onClick)
		document.addEventListener('keydown', onKeydown)
		window.addEventListener('resize', onResize, { passive: true })
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init)
	} else {
		init()
	}
})()
