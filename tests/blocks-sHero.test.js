import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/sHero.json')

// The block reads `data = data || sHero` (same pattern as sProcess/sTransformIntro).
// render-block.js has no gulp-data merge step (that only happens in the real
// gulp pug task), so the fixture must inject the same `source/pug/data/sHero.json`
// payload via pug locals, exactly like production does via gulp-data.
const { sHero: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

function render() {
	return renderBlock('sHero', { locals: { sHero: fixtureData } })
}

// ---------------------------------------------------------------------------
// sHero block — node 161:134
// ---------------------------------------------------------------------------
describe('sHero block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('has one h1 with accessible full heading text', () => {
		const html = render()
		const root = parse(html)
		const h1s = root.querySelectorAll('h1')
		expect(h1s.length).toBe(1)
		expect(h1s[0].text.replace(/\s+/g, ' ').trim()).toContain('Влюбиться')
		expect(h1s[0].text).toContain('навсегда')
	})

	it('renders the fullscreen slider with at least one slide and an LCP image', () => {
		const html = render()
		const root = parse(html)
		expect(root.querySelector('.sHero__slider.swiper')).toBeTruthy()
		const slides = root.querySelectorAll('.swiper-slide')
		expect(slides.length).toBeGreaterThanOrEqual(1)

		const firstImg = root.querySelector('.sHero__img')
		expect(firstImg).toBeTruthy()
		expect(firstImg.getAttribute('fetchpriority')).toBe('high')
		expect(firstImg.getAttribute('loading')).not.toBe('lazy')
		expect(firstImg.getAttribute('alt')).toBeTruthy()
	})

	it('renders two CTA buttons (primary + secondary)', () => {
		const html = render()
		const root = parse(html)
		const buttons = root.querySelectorAll('.sHero__buttons .eb-btn')
		expect(buttons.length).toBe(2)
		expect(root.querySelector('.eb-btn--primary')).toBeTruthy()
		expect(root.querySelector('.eb-btn--secondary')).toBeTruthy()
	})

	it('renders the collection hotspot card', () => {
		const html = render()
		const root = parse(html)
		const hotspot = root.querySelector('.sHero__hotspot.eb-hotspot')
		expect(hotspot).toBeTruthy()
		expect(hotspot.querySelector('.eb-hotspot__card-title').text.trim()).toBe('Коллекция')
		expect(hotspot.querySelector('.eb-hotspot__card-text').text.trim()).toBe('Asoka Mia Dot')
	})

	it('renders slider nav (pagination + arrows)', () => {
		const html = render()
		const root = parse(html)
		expect(root.querySelector('.sHero__nav.eb-slider-nav')).toBeTruthy()
		expect(root.querySelector('.swiper-button-prev')).toBeTruthy()
		expect(root.querySelector('.swiper-button-next')).toBeTruthy()
	})

	it('is themed dark (eb-theme--dark)', () => {
		const html = render()
		const root = parse(html)
		expect(root.querySelector('.sHero.eb-theme--dark')).toBeTruthy()
	})

	it('matches HTML snapshot', () => {
		const html = render()
		expect(html).toMatchSnapshot()
	})
})
