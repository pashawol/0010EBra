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

	it('every card is a Fancybox trigger pointing to the shared inline popup (not the "sReels"/"modal" groups)', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sTestimonials__card')
		expect(cards.length).toBeGreaterThanOrEqual(1)
		for (const card of cards) {
			expect(card.getAttribute('data-fancybox')).toBe('video')
			expect(card.getAttribute('data-fancybox')).not.toBe('modal')
			expect(card.getAttribute('data-fancybox')).not.toBe('sReels')
			expect(card.getAttribute('data-src')).toBe('#sTestimonials-popup')
		}
		// Popup target actually exists exactly once and holds the hidden template.
		const popups = root.querySelectorAll('#sTestimonials-popup')
		expect(popups.length).toBe(1)
		expect(popups[0].getAttribute('style')).toContain('display: none')
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
		it('has its own swiper scope, a title and an accessible close trigger', () => {
			const root = parse(render())
			const popup = root.querySelector('.sTestimonials-popup')
			expect(popup).toBeTruthy()
			expect(popup.hasAttribute('data-swiper-scope')).toBe(true)
			expect(popup.querySelector('.sTestimonials-popup__title')?.text.trim()).toBe('Видео отзывы')
			const close = popup.querySelector('.sTestimonials-popup__close')
			expect(close).toBeTruthy()
			expect(close.hasAttribute('data-fancybox-close')).toBe(true)
			expect(close.getAttribute('aria-label')?.trim()).toBeTruthy()
		})

		it('renders a featured slide with a real, empty-src <video> ready for the client link', () => {
			const root = parse(render())
			const featured = root.querySelector('.sTestimonials-popup__slide--featured')
			expect(featured).toBeTruthy()
			const video = featured.querySelector('video.sTestimonials-popup__video')
			expect(video).toBeTruthy()
			expect(video.getAttribute('poster')).toBeTruthy()
			const source = video.querySelector('source')
			expect(source).toBeTruthy()
			expect(source.getAttribute('src')).toBe('')
			expect(source.getAttribute('type')).toBe('video/mp4')
		})

		it('renders the other stories as preview cards for gallery navigation', () => {
			const root = parse(render())
			const previews = root.querySelectorAll(
				'.sTestimonials-popup__slide:not(.sTestimonials-popup__slide--featured)',
			)
			expect(previews.length).toBeGreaterThanOrEqual(1)
			for (const slide of previews) {
				expect(slide.querySelector('.sTestimonials-popup__poster')).toBeTruthy()
				expect(
					slide.querySelector('.sTestimonials-popup__card-person-name')?.text.trim(),
				).toBeTruthy()
			}
		})

		it('has its own slider nav (arrows) for gallery navigation', () => {
			const root = parse(render())
			const nav = root.querySelector('.sTestimonials-popup__nav')
			expect(nav).toBeTruthy()
			expect(nav.querySelector('.swiper-button-prev')).toBeTruthy()
			expect(nav.querySelector('.swiper-button-next')).toBeTruthy()
		})
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
