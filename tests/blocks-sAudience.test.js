import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'
import sAudienceData from '../source/pug/data/sAudience.json' with { type: 'json' }

// Block reads its data from the global `sAudience` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sAudience: sAudienceData.sAudience }

// ---------------------------------------------------------------------------
// sAudience block — node 313:404 / mobile 692:1129
// ---------------------------------------------------------------------------
describe('sAudience block', () => {
	it('renders without throwing', () => {
		expect(() => renderBlock('sAudience', { locals })).not.toThrow()
	})

	it('renders exactly 7 mosaic cards', () => {
		const html = renderBlock('sAudience', { locals })
		const root = parse(html)
		const cards = root.querySelectorAll('.sAudience__card')
		expect(cards.length).toBe(7)
	})

	it('renders the section title', () => {
		const html = renderBlock('sAudience', { locals })
		const root = parse(html)
		expect(root.querySelector('.sAudience__title h2')).toBeTruthy()
	})

	it('each card has a decoded-alt image and a caption', () => {
		const html = renderBlock('sAudience', { locals })
		const root = parse(html)
		const cards = root.querySelectorAll('.sAudience__card')
		for (const card of cards) {
			const img = card.querySelector('.sAudience__card-img')
			expect(img).toBeTruthy()
			expect(img.getAttribute('src')).toMatch(/^img\/sAudience\//)
			expect(img.getAttribute('alt')).toBeTruthy()
			expect(card.querySelector('.sAudience__card-text')).toBeTruthy()
		}
	})

	it('only the first card image is eager (no loading attribute), the rest are lazy', () => {
		const html = renderBlock('sAudience', { locals })
		const root = parse(html)
		const imgs = root.querySelectorAll('.sAudience__card-img')
		expect(imgs[0].getAttribute('loading')).toBeFalsy()
		for (const img of imgs.slice(1)) {
			expect(img.getAttribute('loading')).toBe('lazy')
		}
	})

	it('renders the round arrow button only on the sensitive-skin card', () => {
		const html = renderBlock('sAudience', { locals })
		const root = parse(html)
		const arrows = root.querySelectorAll('.sAudience__card-arrow')
		expect(arrows.length).toBe(1)
		const parentCard = arrows[0].closest('.sAudience__card--sensitive-skin')
		expect(parentCard).toBeTruthy()
	})

	it('renders the widget with 3 avatars and a caption', () => {
		const html = renderBlock('sAudience', { locals })
		const root = parse(html)
		const avatars = root.querySelectorAll('.sAudience__avatar')
		expect(avatars.length).toBe(3)
		expect(root.querySelector('.sAudience__widget-text')?.text.trim()).toBeTruthy()
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('sAudience', { locals })
		expect(html).toMatchSnapshot()
	})
})
