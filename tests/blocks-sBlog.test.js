import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import { renderBlock } from './helpers/render-block.js'
import sBlogData from '../source/pug/data/sBlog.json' with { type: 'json' }

// Block reads its data from the global `sBlog` var, normally merged in by
// gulp-data at build time (source/pug/data/*.json). The render helper uses a
// bare pug.render() with no such merge step, so the fixture is injected here
// the same way gulp does — as a top-level local matching the JSON's key.
const locals = { sBlog: sBlogData.sBlog }

// ---------------------------------------------------------------------------
// sBlog block — node 495:202 (desktop), 692:1129 → 737:707 (mobile)
// ---------------------------------------------------------------------------
describe('sBlog block', () => {
	it('renders without throwing', () => {
		expect(() => renderBlock('sBlog', { locals })).not.toThrow()
	})

	it('renders exactly 3 article cards', () => {
		const html = renderBlock('sBlog', { locals })
		const root = parse(html)
		const articles = root.querySelectorAll('article.eb-article-card')
		expect(articles.length).toBe(3)
	})

	it('exactly one card carries the featured modifier', () => {
		const html = renderBlock('sBlog', { locals })
		const root = parse(html)
		const featured = root.querySelectorAll('.sBlog__article--feat')
		expect(featured.length).toBe(1)
	})

	it('each card has a <time> with a valid ISO datetime attribute', () => {
		const html = renderBlock('sBlog', { locals })
		const root = parse(html)
		const times = root.querySelectorAll('article.eb-article-card time')
		expect(times.length).toBe(3)
		for (const time of times) {
			const datetime = time.getAttribute('datetime')
			expect(datetime).toBeTruthy()
			expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}$/)
			expect(Number.isNaN(Date.parse(datetime))).toBe(false)
			expect(time.text.trim()).toBeTruthy()
		}
	})

	it('each card has a category tag, a title link and a lazy-loaded image', () => {
		const html = renderBlock('sBlog', { locals })
		const root = parse(html)
		const articles = root.querySelectorAll('article.eb-article-card')
		for (const article of articles) {
			expect(article.querySelector('.eb-tag .eb-tag__label')?.text.trim()).toBeTruthy()
			const titleLink = article.querySelector('.eb-article-card__title a')
			expect(titleLink?.text.trim()).toBeTruthy()
			expect(titleLink?.getAttribute('href')).toBeTruthy()
			const img = article.querySelector('.eb-article-card__media img')
			expect(img?.getAttribute('src')).toBeTruthy()
			expect(img?.getAttribute('loading')).toBe('lazy')
			expect(img?.getAttribute('alt')).toBeTruthy()
		}
	})

	it('renders the section title and the "Все статьи" CTA button', () => {
		const html = renderBlock('sBlog', { locals })
		const root = parse(html)
		expect(root.querySelector('.sBlog__title')).toBeTruthy()
		const cta = root.querySelector('.sBlog__cta')
		expect(cta?.text.trim()).toBe(sBlogData.sBlog.cta.text)
	})

	it('matches HTML snapshot', () => {
		const html = renderBlock('sBlog', { locals })
		expect(html).toMatchSnapshot()
	})
})
