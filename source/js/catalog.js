;(() => {
	const MODAL_ID = 'catalogModal'
	const OPEN_SELECTOR = '[data-catalog-open]'
	const CLOSE_SELECTOR = '[data-catalog-close]'
	const CAT_SELECTOR = '.catalog__cat'
	const OPEN_CLASS = '--open'
	const DRILLED_CLASS = '--drilled'
	const ACTIVE_CLASS = '--active'
	const ANIM_MS = 280
	const HOVER_CLOSE_MS = 260
	const OVERLAY_EVENT = 'eb:overlay-open'
	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

	const modal = document.getElementById(MODAL_ID)
	if (!modal) return

	const panel = modal.querySelector('.catalog__panel')
	const list = modal.querySelector('.catalog__list')
	const body = modal.querySelector('.catalog__body')
	const cover = modal.querySelector('.catalog__media-img.--cover')

	let lastFocused = null
	let closeTimer = null
	let hoverTimer = null
	let scrollLockPadding = ''

	const qsa = (selector, ctx) => Array.from((ctx || modal).querySelectorAll(selector))

	const setTriggersExpanded = (expanded) => {
		for (const trigger of document.querySelectorAll(OPEN_SELECTOR)) {
			trigger.setAttribute('aria-expanded', String(expanded))
		}
	}

	const lockScroll = () => {
		const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
		scrollLockPadding = document.body.style.paddingRight
		if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`
		document.body.classList.add('catalog-scroll-lock')
		document.documentElement.classList.add('catalog-scroll-lock')
	}

	const unlockScroll = () => {
		document.body.classList.remove('catalog-scroll-lock')
		document.documentElement.classList.remove('catalog-scroll-lock')
		document.body.style.paddingRight = scrollLockPadding
	}

	const cancelHoverTimer = () => {
		if (hoverTimer) {
			window.clearTimeout(hoverTimer)
			hoverTimer = null
		}
	}

	function activate(slug) {
		cancelHoverTimer()
		modal.classList.add(DRILLED_CLASS)

		for (const cat of qsa(CAT_SELECTOR)) {
			const isActive = cat.getAttribute('data-catalog-cat') === slug
			cat.classList.toggle(ACTIVE_CLASS, isActive)
			cat.setAttribute('aria-expanded', String(isActive))
		}
		for (const sub of qsa('[data-catalog-sub]')) {
			sub.hidden = sub.getAttribute('data-catalog-sub') !== slug
		}
		for (const img of qsa('[data-catalog-img]')) {
			img.hidden = img.getAttribute('data-catalog-img') !== slug
		}
		if (cover) cover.hidden = true
	}

	function deactivate() {
		cancelHoverTimer()
		modal.classList.remove(DRILLED_CLASS)

		for (const cat of qsa(CAT_SELECTOR)) {
			cat.classList.remove(ACTIVE_CLASS)
			cat.setAttribute('aria-expanded', 'false')
		}
		for (const sub of qsa('[data-catalog-sub]')) sub.hidden = true
		for (const img of qsa('[data-catalog-img]')) img.hidden = true
		if (cover) cover.hidden = false
	}

	function openModal(trigger) {
		document.dispatchEvent(new CustomEvent(OVERLAY_EVENT, { detail: { id: MODAL_ID } }))
		if (closeTimer) {
			window.clearTimeout(closeTimer)
			closeTimer = null
		}
		lastFocused = trigger || document.activeElement
		modal.hidden = false
		deactivate()
		void modal.offsetWidth
		modal.classList.add(OPEN_CLASS)
		lockScroll()
		setTriggersExpanded(true)

		const closeBtn = modal.querySelector('.catalog__close')
		if (closeBtn) closeBtn.focus()
	}

	function closeModal() {
		if (modal.hidden || closeTimer) return
		modal.classList.remove(OPEN_CLASS)
		closeTimer = window.setTimeout(() => {
			modal.hidden = true
			deactivate()
			closeTimer = null
		}, ANIM_MS)
		unlockScroll()
		setTriggersExpanded(false)

		if (lastFocused && typeof lastFocused.focus === 'function') {
			lastFocused.focus({ preventScroll: true })
		}
		lastFocused = null
	}

	function trapFocus(event) {
		if (event.key !== 'Tab') return
		const focusable = qsa(FOCUSABLE).filter((el) => el.offsetParent !== null)
		if (!focusable.length) return

		const first = focusable[0]
		const last = focusable[focusable.length - 1]

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault()
			first.focus()
		}
	}

	document.addEventListener(OVERLAY_EVENT, (event) => {
		if (event.detail?.id !== MODAL_ID && !modal.hidden) closeModal()
	})

	document.addEventListener('click', (event) => {
		const opener = event.target.closest(OPEN_SELECTOR)
		if (opener) {
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

		const cat = event.target.closest(CAT_SELECTOR)
		if (cat && !cat.classList.contains(ACTIVE_CLASS)) {
			event.preventDefault()
			activate(cat.getAttribute('data-catalog-cat'))
		}
	})

	document.addEventListener('keydown', (event) => {
		if (modal.hidden) return
		if (event.key === 'Escape') {
			event.preventDefault()
			if (modal.classList.contains(DRILLED_CLASS)) deactivate()
			else closeModal()
			return
		}
		trapFocus(event)
	})

	if (list) {
		list.addEventListener('mouseover', (event) => {
			const cat = event.target.closest(CAT_SELECTOR)
			if (cat) activate(cat.getAttribute('data-catalog-cat'))
		})
		list.addEventListener('focusin', (event) => {
			const cat = event.target.closest(CAT_SELECTOR)
			if (cat) activate(cat.getAttribute('data-catalog-cat'))
		})
	}

	if (body) {
		body.addEventListener('mouseover', cancelHoverTimer)
		body.addEventListener('mouseleave', () => {
			cancelHoverTimer()
			hoverTimer = window.setTimeout(deactivate, HOVER_CLOSE_MS)
		})
	}

	if (panel) {
		panel.addEventListener('mouseleave', () => {
			cancelHoverTimer()
			hoverTimer = window.setTimeout(deactivate, HOVER_CLOSE_MS)
		})
	}
})()
