import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/sCollection.json')

// The block reads `data = data || sCollection` (same pattern as sHero/sExpertise).
// render-block.js has no gulp-data merge step (that only happens in the real
// gulp pug task), so the fixture must inject the same
// source/pug/data/sCollection.json payload via pug locals, exactly like
// production does via gulp-data.
const { sCollection: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

function render() {
	return renderBlock('sCollection', { locals: { sCollection: fixtureData } })
}

// ---------------------------------------------------------------------------
// sCollection block — node 385:1497 (desktop, full-bleed) / 726:478 (mobile)
// ---------------------------------------------------------------------------
describe('sCollection block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('is a dark-theme full-bleed section', () => {
		const root = parse(render())
		const section = root.querySelector('section.sCollection')
		expect(section).toBeTruthy()
		expect(section.classList.contains('eb-theme--dark')).toBe(true)
	})

	it('carries data-swiper-scope so the shared initializer finds its own nav', () => {
		const root = parse(render())
		expect(root.querySelector('section.sCollection').getAttribute('data-swiper-scope')).not.toBe(
			null,
		)
	})

	it('renders one slide per data entry, each with its own content and photo', () => {
		const root = parse(render())
		const slides = root.querySelectorAll('.swiper-slide')
		expect(slides.length).toBe(fixtureData.slides.length)

		const titles = root.querySelectorAll('.sCollection__title')
		expect(titles.length).toBe(fixtureData.slides.length)
		expect(titles[0].text.replace(/\s+/g, ' ').trim()).toContain('LULU')
		expect(titles[1].text.trim()).toBe('Lizzy Wizzy')

		const photos = root.querySelectorAll('.sCollection__photo')
		expect(photos.length).toBe(fixtureData.slides.length)
		for (const photo of photos) {
			expect(photo.getAttribute('alt')).toBeTruthy()
		}
		// First slide is the LCP image: no lazy-loading, fetchpriority=high.
		expect(photos[0].getAttribute('fetchpriority')).toBe('high')
		expect(photos[0].getAttribute('loading')).not.toBe('lazy')
		expect(photos[1].getAttribute('loading')).toBe('lazy')
	})

	it('renders a "New" badge and CTA button per slide', () => {
		const root = parse(render())
		expect(root.querySelectorAll('.sCollection__badge').length).toBe(fixtureData.slides.length)
		const ctas = root.querySelectorAll('.sCollection__cta.eb-btn--secondary')
		expect(ctas.length).toBe(fixtureData.slides.length)
	})

	it('renders product hotspots with a thumbnail, title and price', () => {
		const root = parse(render())
		const hotspots = root.querySelectorAll('.eb-hotspot')
		const expectedCount = fixtureData.slides.reduce(
			(sum, slide) => sum + (slide.hotspots?.length || 0),
			0,
		)
		expect(hotspots.length).toBe(expectedCount)

		const first = hotspots[0]
		expect(first.querySelector('.eb-hotspot__card-thumb img')).toBeTruthy()
		expect(first.querySelector('.eb-hotspot__card-title').text.trim()).toBe('LULU Soft full cup')
		expect(first.querySelector('.eb-hotspot__card-text').text.trim()).toBe('9 200 ₽')
		expect(first.querySelector('.eb-hotspot__card-icon')).toBeTruthy()

		// Anchor point comes from the data as inline %-of-photo positioning
		// (грабля: хотспоты в % от фото, не от высоты секции).
		const style = first.getAttribute('style') || ''
		expect(style).toMatch(/top:\s*[\d.]+%/)
		expect(style).toMatch(/left:\s*[\d.]+%/)
	})

	it('renders the persistent label and slider nav outside the per-slide content', () => {
		const root = parse(render())
		expect(root.querySelector('.sCollection__label')).toBeTruthy()
		const nav = root.querySelector('.sCollection__nav.eb-slider-nav')
		expect(nav).toBeTruthy()
		expect(root.querySelector('.swiper-button-prev')).toBeTruthy()
		expect(root.querySelector('.swiper-button-next')).toBeTruthy()
		expect(root.querySelector('.swiper-pagination')).toBeTruthy()
	})

	it('no element carries a duplicated class (bemto raw-modifier-string pitfall)', () => {
		const root = parse(render())
		for (const el of root.querySelectorAll('[class]')) {
			const classes = el.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
		}
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/sCollection/_sCollection.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
