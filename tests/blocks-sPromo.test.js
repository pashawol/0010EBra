import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'
import sPromoData from '../source/pug/data/sPromo.json' with { type: 'json' }

// Block reads its data from the global `sPromo` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sPromo: sPromoData.sPromo }

// ---------------------------------------------------------------------------
// sPromo block — node 385:1516 (desktop), mobile Banners 726:433 (692:1129)
// ---------------------------------------------------------------------------
describe('sPromo block', () => {
	it('renders without throwing', () => {
		expect(() => renderBlock('sPromo', { locals })).not.toThrow()
	})

	it('renders exactly 3 banner cards', () => {
		const html = renderBlock('sPromo', { locals })
		const root = parse(html)
		const cards = root.querySelectorAll('.sPromo__card')
		expect(cards.length).toBe(3)
	})

	it('each card has an image, a badge and a title', () => {
		const html = renderBlock('sPromo', { locals })
		const root = parse(html)
		const cards = root.querySelectorAll('.sPromo__card')
		for (const card of cards) {
			const img = card.querySelector('img')
			expect(img).toBeTruthy()
			expect(img.getAttribute('src')).toBeTruthy()
			expect(img.getAttribute('loading')).toBe('lazy')

			const badge = card.querySelector('.sPromo__card-badge')
			expect(badge).toBeTruthy()
			expect(badge.querySelector('.sPromo__card-badge-label')?.text.trim()).toBeTruthy()
			// Icon is inline (no sprite entry for award/gift/percent) — assert it
			// actually rendered, not just referenced.
			expect(badge.querySelector('svg')).toBeTruthy()
			expect(badge.querySelector('svg path')).toBeTruthy()

			const title = card.querySelector('.sPromo__card-title-value')
			expect(title?.text.trim()).toBeTruthy()

			const text = card.querySelector('.sPromo__card-text')
			expect(text?.text.trim()).toBeTruthy()
		}
	})

	it('the week card carries the dark theme class', () => {
		const html = renderBlock('sPromo', { locals })
		const root = parse(html)
		const weekCard = root.querySelector('.sPromo__card--week')
		expect(weekCard).toBeTruthy()
	})

	it('the outlet card renders its badge inside the card body, not floating over the photo', () => {
		const html = renderBlock('sPromo', { locals })
		const root = parse(html)
		const outletCard = root.querySelector('.sPromo__card--outlet')
		expect(outletCard).toBeTruthy()
		const body = outletCard.querySelector('.sPromo__card-body')
		expect(body.querySelector('.sPromo__card-badge')).toBeTruthy()
	})

	it('the week and outlet cards render the "lead" line ("До") ahead of the value', () => {
		const html = renderBlock('sPromo', { locals })
		const root = parse(html)
		for (const mod of ['week', 'outlet']) {
			const card = root.querySelector(`.sPromo__card--${mod}`)
			const lead = card.querySelector('.sPromo__card-title-lead')
			expect(lead?.text.trim()).toBe('До')
		}
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('sPromo', { locals })
		expect(html).toMatchSnapshot()
	})
})
