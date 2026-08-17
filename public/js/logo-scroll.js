;(() => {
	const logo = document.querySelector('.top-nav__logo')
	const mark = logo?.querySelector('.eb-logo__mark')
	if (!logo || !mark) return

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

	const { gsap, ScrollTrigger } = window
	if (!gsap || !ScrollTrigger) return
	gsap.registerPlugin(ScrollTrigger)

	const full = () => {
		const saved = mark.style.height
		mark.style.height = ''
		const h = mark.getBoundingClientRect().height
		mark.style.height = saved
		return h || 30
	}

	gsap.fromTo(
		mark,
		{ height: () => full(), autoAlpha: 1, y: 0 },
		{
			height: 0,
			autoAlpha: 0,
			y: () => -full() / 2,
			ease: 'none',
			scrollTrigger: {
				trigger: document.documentElement,
				start: 'top top',
				end: '+=160',
				scrub: 0.4,
				invalidateOnRefresh: true,
			},
		},
	)
})()
