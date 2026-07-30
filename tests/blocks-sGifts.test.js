import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'
import sGiftsData from '../source/pug/data/sGifts.json' with { type: 'json' }

// Block reads its data from the global `sGifts` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sGifts: sGiftsData.sGifts }

// ---------------------------------------------------------------------------
// sGifts block — node 483:1239 (desktop), 726:675 (mobile 692:1129)
// ---------------------------------------------------------------------------
describe('sGifts block', () => {
	it('renders without throwing', () => {
		expect(() => renderBlock('sGifts', { locals })).not.toThrow()
	})

	it('renders exactly 3 banner cards', () => {
		const html = renderBlock('sGifts', { locals })
		const root = parse(html)
		const cards = root.querySelectorAll('.sGifts__card')
		expect(cards.length).toBe(3)
	})

	it('each card has an image and a caption', () => {
		const html = renderBlock('sGifts', { locals })
		const root = parse(html)
		const cards = root.querySelectorAll('.sGifts__card')
		for (const card of cards) {
			const img = card.querySelector('img')
			expect(img).toBeTruthy()
			expect(img.getAttribute('src')).toBeTruthy()
			expect(img.getAttribute('loading')).toBe('lazy')
			const caption = card.querySelector('.sGifts__card-caption')
			expect(caption?.text.trim()).toBeTruthy()
		}
	})

	it('certificate card carries the dark theme class', () => {
		const html = renderBlock('sGifts', { locals })
		const root = parse(html)
		const certCard = root.querySelector('.sGifts__card--cert')
		expect(certCard).toBeTruthy()
		expect(certCard.classList.contains('eb-theme--dark')).toBe(true)
	})

	it('renders the mini-card widget with 3 avatars and the emotion text', () => {
		const html = renderBlock('sGifts', { locals })
		const root = parse(html)
		const avatars = root.querySelectorAll('.sGifts__avatar')
		expect(avatars.length).toBe(3)
		const widgetText = root.querySelector('.sGifts__widget-text')
		expect(widgetText?.text.trim()).toBeTruthy()
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('sGifts', { locals })
		expect(html).toMatchSnapshot()
	})
})
