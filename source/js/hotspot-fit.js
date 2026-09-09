;(() => {
	const GAP = 16

	const cards = Array.from(document.querySelectorAll('[data-hotspot-fit] .eb-hotspot__card'))
	if (!cards.length) return

	const fit = () => {
		for (const card of cards) card.style.setProperty('--hs-fit-shift', '0px')

		const limit = document.documentElement.clientWidth - GAP
		const shifts = cards.map((card) => {
			const box = card.getBoundingClientRect()
			let shift = 0
			if (box.right > limit) shift = limit - box.right
			if (box.left + shift < GAP) shift = GAP - box.left
			return Math.round(shift)
		})

		cards.forEach((card, i) => {
			card.style.setProperty('--hs-fit-shift', `${shifts[i]}px`)
		})
	}

	let queued = false
	const schedule = () => {
		if (queued) return
		queued = true
		requestAnimationFrame(() => {
			queued = false
			fit()
		})
	}

	fit()
	window.addEventListener('resize', schedule)
	window.addEventListener('load', schedule)
	document.fonts?.ready.then(schedule)

	const frames = new Set()
	for (const card of cards) {
		const frame = card.closest('.eb-hotspot')?.parentElement
		if (frame) frames.add(frame)
	}
	if (window.ResizeObserver) {
		const ro = new ResizeObserver(schedule)
		for (const frame of frames) ro.observe(frame)
	}
})()
