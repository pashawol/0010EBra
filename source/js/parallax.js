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

		const amount = () => {
			const raw = Number.parseFloat(getComputedStyle(img).getPropertyValue('--parallax-amount'))
			if (!Number.isFinite(raw)) return 1
			return Math.min(Math.max(raw, 0), 1)
		}

		const range = () => {
			const boxH = box.getBoundingClientRect().height
			const imgH = img.getBoundingClientRect().height
			if (!imgH || imgH <= boxH) return 0
			const slack = (imgH - boxH) / 2
			return ((slack * amount()) / imgH) * 100
		}

		gsap.fromTo(
			img,
			{ yPercent: () => -range() },
			{
				yPercent: () => range(),
				ease: 'none',
				scrollTrigger: {
					trigger: box,
					start: img.dataset.parallaxStart || 'top bottom',
					end: img.dataset.parallaxEnd || 'bottom top',
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
