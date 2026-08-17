;(() => {
	const openers = Array.from(document.querySelectorAll('[data-video-modal]'))
	if (!openers.length) return

	const { Swiper, Fancybox } = window
	if (!Swiper || !Fancybox) return

	const instances = new Map()

	const setup = (modal) => {
		if (instances.has(modal)) return instances.get(modal)

		const sliderEl = modal.querySelector('.video-modal__slider')
		const videos = Array.from(modal.querySelectorAll('[data-video-index]'))

		const stopAll = () => {
			for (const v of videos) {
				v.pause()
				v.currentTime = 0
			}
		}

		const playActive = (index) => {
			stopAll()
			const active = videos[index]
			if (!active) return
			active.preload = 'auto'
			const started = active.play()
			if (started?.catch) started.catch(() => {})
		}

		const swiper = new Swiper(sliderEl, {
			slidesPerView: 'auto',
			loop: false,
			rewind: false,
			centeredSlides: true,
			slideToClickedSlide: true,
			spaceBetween: 24,
			watchSlidesProgress: true,
			effect: 'coverflow',
			coverflowEffect: {
				rotate: 0,
				stretch: 0,
				depth: 220,
				modifier: 1,
				scale: 0.84,
				slideShadows: false,
			},
			navigation: {
				prevEl: modal.querySelector('.eb-slider-nav__prev'),
				nextEl: modal.querySelector('.eb-slider-nav__next'),
			},
			breakpoints: {
				992: {
					spaceBetween: 175,
					coverflowEffect: { depth: 260, scale: 0.84, rotate: 0, stretch: 0, slideShadows: false },
				},
			},
			on: { slideChange: (sw) => playActive(sw.activeIndex) },
		})

		const KEEP_OPEN = '.video-modal__slider, .video-modal__head, .video-modal__nav, button, a'

		modal.addEventListener('click', (event) => {
			if (event.target.closest(KEEP_OPEN)) return
			Fancybox.close()
		})

		const api = {
			sync: (index) => {
				swiper.update()
				swiper.slideTo(index, 0)
				playActive(index)
			},
			stopAll,
		}
		instances.set(modal, api)
		return api
	}

	for (const opener of openers) {
		opener.addEventListener('click', (event) => {
			event.preventDefault()
			const modal = document.getElementById(opener.getAttribute('data-video-modal'))
			if (!modal) return

			const index = Number(opener.getAttribute('data-video-index')) || 0
			const open = () => setup(modal).sync(index)

			Fancybox.show([{ src: `#${modal.id}`, type: 'inline' }], {
				mainClass: 'fancybox--video',
				dragToClose: false,
				autoFocus: false,
				placeFocusBack: false,
				closeButton: false,
				Carousel: {
					Autoplay: false,
					gestures: false,
					dragFree: false,
					infinite: false,
					Navigation: false,
					Dots: false,
				},
				on: {
					done: open,
					destroy: () => instances.get(modal)?.stopAll(),
					close: () => instances.get(modal)?.stopAll(),
				},
			})
			requestAnimationFrame(() => requestAnimationFrame(open))
		})
	}
})()
