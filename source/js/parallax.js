;(() => {
	const targets = Array.from(document.querySelectorAll('[data-parallax]'))
	if (!targets.length) return

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	const { gsap, ScrollTrigger } = window
	if (!gsap || !ScrollTrigger) return
	gsap.registerPlugin(ScrollTrigger)

	const boxOf = (img) => {
		let el = img.parentElement
		for (let i = 0; el && i < 4; i++) {
			const overflow = getComputedStyle(el).overflow
			if (overflow === 'hidden' || overflow === 'clip') return el
			el = el.parentElement
		}
		return img.parentElement
	}

	for (const img of targets) {
		const box = boxOf(img)
		if (!box) continue

		const range = () => {
			const boxH = box.getBoundingClientRect().height
			const imgH = img.getBoundingClientRect().height
			if (!imgH || imgH <= boxH) return 0
			return ((imgH - boxH) / 2 / imgH) * 100
		}

		gsap.fromTo(
			img,
			{ yPercent: () => -range() },
			{
				yPercent: () => range(),
				ease: 'none',
				scrollTrigger: {
					trigger: box,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 0.6,
					invalidateOnRefresh: true,
				},
			},
		)
	}

	for (const img of targets) {
		if (img.complete) continue
		img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
	}
})()
