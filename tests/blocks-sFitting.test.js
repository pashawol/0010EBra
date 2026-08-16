import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'
import sFittingData from '../source/pug/data/sFitting.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Block reads its data from the global `sFitting` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sFitting: sFittingData.sFitting }

function render() {
	return renderBlock('sFitting', { locals })
}

// ---------------------------------------------------------------------------
// sFitting block — «Подбор идеального варианта», node 313:442 (desktop) /
// 692:1129 → 700:1316 (mobile)
// ---------------------------------------------------------------------------
describe('sFitting block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('renders the title and lead paragraph', () => {
		const root = parse(render())
		expect(root.querySelector('.sFitting__title h2')?.text.trim()).toBe(sFittingData.sFitting.title)
		expect(root.querySelector('.sFitting__lead')?.text.trim()).toBe(sFittingData.sFitting.text)
	})

	it('renders the fact block (80%) with a dark solid tag', () => {
		const root = parse(render())
		const factValue = root.querySelector('.sFitting__fact .eb-fact__value')
		expect(factValue?.text.trim()).toBe('80%')
		expect(root.querySelector('.sFitting__fact .eb-tag__label')?.text.trim()).toBe('Факт')
	})

	it('renders exactly 3 hotspots reusing the shared +ebHotspot component', () => {
		const root = parse(render())
		const hotspots = root.querySelectorAll('.eb-hotspot.sFitting__hotspot')
		expect(hotspots.length).toBe(3)
		const texts = hotspots.map((h) => h.querySelector('.eb-hotspot__card-text')?.text.trim())
		expect(texts).toEqual(['Плотная посадка', 'Комфортная чашка', 'Надежная поддержка груди'])
	})

	it('positions each hotspot with both mobile and desktop percentage custom properties', () => {
		const root = parse(render())
		const hotspots = root.querySelectorAll('.sFitting__hotspot')
		for (const hotspot of hotspots) {
			const style = hotspot.getAttribute('style') || ''
			expect(style).toMatch(/--hs-x-m:\s*[\d.]+%/)
			expect(style).toMatch(/--hs-y-m:\s*[\d.]+%/)
			expect(style).toMatch(/--hs-x-d:\s*[\d.]+%/)
			expect(style).toMatch(/--hs-y-d:\s*[\d.]+%/)
		}
	})

	it('card-direction modifiers are set per hotspot, independently for desktop and mobile', () => {
		const root = parse(render())
		const hotspots = root.querySelectorAll('.sFitting__hotspot')
		const byText = (text) =>
			hotspots.find((h) => h.querySelector('.eb-hotspot__card-text')?.text.trim() === text)

		// Desktop: dot near the photo's left edge → card opens left (bleeds over bg, not over the photo).
		expect(byText('Комфортная чашка')?.classList.contains('sFitting__hotspot--left-d')).toBe(true)

		// Mobile: dot near the photo's right edge → card opens left to stay on-screen
		// (the shared component's default "below, starting at the dot" would clip off-screen).
		expect(byText('Плотная посадка')?.classList.contains('sFitting__hotspot--left-m')).toBe(true)
		expect(
			byText('Надежная поддержка груди')?.classList.contains('sFitting__hotspot--left-m'),
		).toBe(true)
	})

	it('renders both curved arrows as inline SVG, not raster images', () => {
		const html = render()
		const root = parse(html)
		expect(root.querySelectorAll('.sFitting__arrow-svg').length).toBe(2)
		// Guard against silently falling back to a raster image for the arrows.
		expect(html).not.toMatch(/<img[^>]+arrow/i)
	})

	it('renders the responsive photo with mobile src + desktop <source>, decodable + lazy + empty alt', () => {
		const root = parse(render())
		const picture = root.querySelector('.sFitting__photo-wrap picture')
		expect(picture).toBeTruthy()
		const source = picture.querySelector('source')
		expect(source?.getAttribute('srcset')).toBe(sFittingData.sFitting.photo.desktop)
		expect(source?.getAttribute('media')).toBeTruthy()
		const img = picture.querySelector('img.sFitting__photo')
		expect(img?.getAttribute('src')).toBe(sFittingData.sFitting.photo.mobile)
		expect(img?.getAttribute('loading')).toBe('lazy')
		expect(img?.getAttribute('alt')).toBe('')
	})

	it('renders the desktop-only mini info (Цвет/Размер) and the fact block exactly once each', () => {
		const root = parse(render())
		const meta = root.querySelectorAll('.sFitting__meta-item')
		expect(meta.length).toBe(2)
		expect(root.querySelectorAll('.sFitting__fact').length).toBe(1)
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
			path.resolve(__dirname, '..', 'source/pug/blocks/sFitting/_sFitting.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
