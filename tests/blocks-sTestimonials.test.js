import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function render() {
	return renderBlock('sTestimonials')
}

// ---------------------------------------------------------------------------
// sTestimonials block — node 495:336 (desktop) / 739:766 (mobile, часть
// 692:1129); попап видео-отзывов — node 682:238
// ---------------------------------------------------------------------------
describe('sTestimonials block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('is a section with a swiper scope for the reel slider', () => {
		const root = parse(render())
		const section = root.querySelector('section.sTestimonials')
		expect(section).toBeTruthy()
		expect(section.hasAttribute('data-swiper-scope')).toBe(true)
	})

	it('renders a centered title and the third-party reviews module placeholder', () => {
		const root = parse(render())
		expect(root.querySelector('.sTestimonials__title h2')?.text.trim()).toBe('Отзывы')
		const placeholder = root.querySelector('.sTestimonials__placeholder')
		expect(placeholder).toBeTruthy()
		expect(placeholder.querySelector('.sTestimonials__placeholder-note')?.text.trim()).toBe(
			'Сторонний модуль с отзывами',
		)
		expect(root.querySelector('.sTestimonials__label')?.text.trim()).toBe('Видео отзывы')
	})

	it('renders at least one slide with a lazy-loaded, described poster', () => {
		const root = parse(render())
		const slides = root.querySelectorAll('.sTestimonials__slide.swiper-slide')
		expect(slides.length).toBeGreaterThanOrEqual(1)
		const poster = root.querySelector('.sTestimonials__poster')
		expect(poster).toBeTruthy()
		expect(poster.getAttribute('loading')).toBe('lazy')
		expect(poster.getAttribute('alt')).toBe('')
	})

	it('every card opens the shared video popup and passes its index', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sTestimonials__card')
		expect(cards.length).toBeGreaterThanOrEqual(1)
		cards.forEach((card, i) => {
			expect(card.getAttribute('data-video-modal')).toBe('sTestimonialsModal')
			expect(card.getAttribute('data-video-index')).toBe(String(i))
		})
		expect(root.querySelectorAll('#sTestimonialsModal').length).toBe(1)
		expect(root.querySelector('#sTestimonials-popup')).toBeFalsy()
	})

	it('every card carries a name/age/quote text block and a visible play affordance', () => {
		const root = parse(render())
		for (const card of root.querySelectorAll('.sTestimonials__card')) {
			expect(card.querySelector('.sTestimonials__play-icon')).toBeTruthy()
			expect(card.querySelector('.sTestimonials__card-person-name')?.text.trim()).toBeTruthy()
			expect(card.querySelector('.sTestimonials__card-person-age')?.text.trim()).toBeTruthy()
			expect(card.querySelector('.sTestimonials__card-quote')?.text.trim()).toBeTruthy()
		}
	})

	it('has an accessible label describing the story on every card', () => {
		const root = parse(render())
		for (const card of root.querySelectorAll('.sTestimonials__card')) {
			expect(card.getAttribute('aria-label')?.trim()).toBeTruthy()
		}
	})

	it('renders the intro and the shared slider nav for the section slider', () => {
		const root = parse(render())
		const nav = root.querySelector('.sTestimonials__nav')
		expect(nav?.querySelector('.swiper-pagination')).toBeTruthy()
		expect(root.querySelectorAll('.sTestimonials__nav .swiper-button-prev').length).toBe(1)
		expect(root.querySelectorAll('.sTestimonials__nav .swiper-button-next').length).toBe(1)
	})

	describe('video review popup (node 682:238)', () => {
		it('reuses the shared video-modal component with a title and a close trigger', () => {
			const root = parse(render())
			const popup = root.querySelector('#sTestimonialsModal')
			expect(popup).toBeTruthy()
			expect(popup.classList.contains('video-modal')).toBe(true)
			expect(popup.querySelector('.video-modal__title')?.text.trim()).toBeTruthy()
			const close = popup.querySelector('.video-modal__close')
			expect(close).toBeTruthy()
			expect(close.hasAttribute('data-fancybox-close')).toBe(true)
			expect(close.getAttribute('aria-label')?.trim()).toBeTruthy()
		})

		it('holds one native video player per card, indexed to match the triggers', () => {
			const root = parse(render())
			const popup = root.querySelector('#sTestimonialsModal')
			const videos = popup.querySelectorAll('.video-modal__video')
			expect(videos.length).toBe(root.querySelectorAll('.sTestimonials__card').length)
			videos.forEach((v, i) => {
				expect(v.tagName).toBe('VIDEO')
				expect(v.getAttribute('controls')).not.toBeUndefined()
				expect(v.getAttribute('playsinline')).not.toBeUndefined()
				expect(v.getAttribute('src')).toMatch(/^video\//)
				expect(v.getAttribute('poster')).toBeTruthy()
				expect(v.getAttribute('data-video-index')).toBe(String(i))
			})
		})

		it('reuses the shared slider navigation instead of custom buttons', () => {
			const root = parse(render())
			const popup = root.querySelector('#sTestimonialsModal')
			expect(popup.querySelector('.eb-slider-nav__prev')).toBeTruthy()
			expect(popup.querySelector('.eb-slider-nav__next')).toBeTruthy()
			expect(root.querySelector('.sTestimonials-popup__nav')).toBeFalsy()
		})
	})

	it('modal slide N carries the same poster and its own video as card N', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sTestimonials__card')
		const videos = root.querySelectorAll('#sTestimonialsModal .video-modal__video')
		expect(videos.length).toBe(cards.length)
		cards.forEach((c, i) => {
			expect(videos[i].getAttribute('poster')).toBe(
				c.querySelector('.sTestimonials__poster').getAttribute('src'),
			)
		})
		const sources = [...videos].map((v) => v.getAttribute('src'))
		expect(new Set(sources).size).toBe(sources.length)
	})

	it('has no duplicated classes on any element (bemto raw-modifier-string pitfall)', () => {
		const root = parse(render())
		for (const el of root.querySelectorAll('[class]')) {
			const classes = el.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
		}
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/sTestimonials/_sTestimonials.scss'),
			'utf8',
		)
		// rgba(44, 43, 43, x) — окраска scrim по числам Black из UI-Kit, тот же
		// приём, что и в sReels (alpha-подмес без готового rgba-токена).
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
