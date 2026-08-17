;(() => {
	const SHIFT = 70
	const DURATION = 1
	const STAGGER = 60
	const AXIS = {
		bottom: { y: SHIFT },
		top: { y: -SHIFT },
		left: { x: -SHIFT },
		right: { x: SHIFT },
	}

	const firstSection = document.querySelector('main > section')
	for (const el of document.querySelectorAll('.eb-title, .eb-fact, [data-anim="reveal"]')) {
		if (firstSection?.contains(el)) continue
		if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'bottom')
	}

	const groups = Array.from(document.querySelectorAll('[data-reveal-group]'))
	for (const group of groups) {
		const raw = group.getAttribute('data-reveal-group')
		const selector = raw && raw !== 'data-reveal-group' ? raw : ''
		const from = group.getAttribute('data-reveal-from') || 'bottom'
		const items = selector
			? Array.from(group.querySelectorAll(selector))
			: Array.from(group.children)
		for (const el of items) {
			el.setAttribute('data-reveal', from)
			el.setAttribute('data-reveal-in-group', '')
		}
	}

	const singles = Array.from(document.querySelectorAll('[data-reveal]:not([data-reveal-in-group])'))
	if (!singles.length && !groups.length) return

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	const { gsap, ScrollTrigger } = window
	if (!gsap || !ScrollTrigger) return
	gsap.registerPlugin(ScrollTrigger)

	const offsetOf = (el) => AXIS[el.getAttribute('data-reveal')] || AXIS.bottom

	const animate = (el, lag) => {
		gsap.fromTo(
			el,
			{ autoAlpha: 0, ...offsetOf(el) },
			{
				autoAlpha: 1,
				x: 0,
				y: 0,
				duration: DURATION,
				ease: 'power2.out',
				overwrite: 'auto',
				scrollTrigger: {
					trigger: el,
					start: `top bottom-=${lag}`,
					end: 'top 80%',
					scrub: 0.6,
					invalidateOnRefresh: true,
				},
			},
		)
	}

	for (const el of singles) animate(el, 0)

	for (const group of groups) {
		const items = Array.from(group.querySelectorAll('[data-reveal-in-group]'))
		if (!items.length) continue
		const step = Number(group.getAttribute('data-reveal-stagger')) || STAGGER
		let lag = 0
		let prevTop = null
		items.forEach((el, i) => {
			const top = Math.round(el.getBoundingClientRect().top)
			if (prevTop !== null && Math.abs(top - prevTop) > 20) lag = 0
			else if (i > 0) lag += step
			prevTop = top
			animate(el, lag)
		})
	}
})()
