;(() => {
	const pairs = []

	const hero = document.querySelector('.hero-stack .sHero')
	const heroCap = document.querySelector('.hero-stack .section-cap')
	const heroOverlap = heroCap?.closest('.section, section')
	if (hero && heroOverlap) pairs.push({ pinned: hero, overlap: heroOverlap, delay: '0' })

	for (const pinned of document.querySelectorAll('[data-overlap]')) {
		const raw = pinned.getAttribute('data-overlap')
		const delay = raw && raw !== 'data-overlap' ? raw : '0'
		const overlap = pinned.nextElementSibling?.querySelector?.('.section-cap')
			? pinned.nextElementSibling
			: findCapOwnerAfter(pinned)
		if (overlap) pairs.push({ pinned, overlap, delay })
	}

	function findCapOwnerAfter(el) {
		const caps = Array.from(document.querySelectorAll('.section-cap'))
		for (const cap of caps) {
			const owner = cap.parentElement
			if (owner && el.compareDocumentPosition(owner) & Node.DOCUMENT_POSITION_FOLLOWING)
				return owner
		}
		return null
	}

	if (!pairs.length) return
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	const { gsap, ScrollTrigger } = window
	if (!gsap || !ScrollTrigger) return
	gsap.registerPlugin(ScrollTrigger)

	for (const { pinned, overlap, delay } of pairs) {
		ScrollTrigger.create({
			trigger: pinned,
			start: `bottom bottom-=${delay}`,
			endTrigger: overlap,
			end: 'top top',
			pin: pinned,
			pinSpacing: false,
			invalidateOnRefresh: true,
			anticipatePin: 1,
		})
	}

	let refreshQueued = false
	const queueRefresh = () => {
		if (refreshQueued) return
		refreshQueued = true
		requestAnimationFrame(() => {
			refreshQueued = false
			ScrollTrigger.refresh()
		})
	}

	if ('ResizeObserver' in window) {
		const ro = new ResizeObserver(queueRefresh)
		for (const { pinned, overlap } of pairs) {
			for (const el of pinned.children) ro.observe(el)
			ro.observe(overlap)
		}
	}

	if (document.fonts?.ready) document.fonts.ready.then(queueRefresh)
	window.addEventListener('load', queueRefresh, { once: true })
})()
