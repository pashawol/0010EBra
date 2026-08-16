import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function render() {
	return renderBlock('sReels')
}

// ---------------------------------------------------------------------------
// sReels block — node 321:1063 (desktop) / 721:2 (mobile, часть 692:1129)
// ---------------------------------------------------------------------------
describe('sReels block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('is a section with a swiper scope for the reel slider', () => {
		const root = parse(render())
		const section = root.querySelector('section.sReels')
		expect(section).toBeTruthy()
		expect(section.hasAttribute('data-swiper-scope')).toBe(true)
	})

	it('renders at least one slide with a lazy-loaded, described poster', () => {
		const root = parse(render())
		const slides = root.querySelectorAll('.swiper-slide')
		expect(slides.length).toBeGreaterThanOrEqual(1)
		const poster = root.querySelector('.sReels__poster')
		expect(poster).toBeTruthy()
		expect(poster.getAttribute('loading')).toBe('lazy')
		expect(poster.getAttribute('alt')).toBe('')
	})

	it('every card is a Fancybox trigger pointing to a hidden inline video template (not the shared "modal" group)', () => {
		const root = parse(render())
		const cards = root.querySelectorAll('.sReels__card')
		expect(cards.length).toBeGreaterThanOrEqual(1)
		for (const card of cards) {
			expect(card.getAttribute('data-fancybox')).toBe('sReels')
			expect(card.getAttribute('data-fancybox')).not.toBe('modal')
			const src = card.getAttribute('data-src')
			expect(src).toMatch(/^#sReels-video-\d+$/)
			const modal = root.querySelector(src)
			expect(modal).toBeTruthy()
			expect(modal.querySelector('video')).toBeTruthy()
		}
	})

	it('has an accessible label describing the story on every card', () => {
		const root = parse(render())
		for (const card of root.querySelectorAll('.sReels__card')) {
			expect(card.getAttribute('aria-label')?.trim()).toBeTruthy()
		}
	})

	it('renders the first slide with the floating person + product widgets from the design', () => {
		const root = parse(render())
		const person = root.querySelector('.sReels__person')
		expect(person).toBeTruthy()
		expect(person.querySelector('.sReels__person-avatar')).toBeTruthy()
		const product = root.querySelector('.sReels__product')
		expect(product).toBeTruthy()
		expect(product.querySelector('.sReels__swatch')).toBeTruthy()
	})

	it('renders the intro tag/title/subtitle and the shared slider nav', () => {
		const root = parse(render())
		expect(root.querySelector('.sReels__tag .eb-tag__label')?.text.trim()).toBe('Примеры')
		expect(root.querySelector('.sReels__title h2')).toBeTruthy()
		expect(root.querySelector('.sReels__subtitle')).toBeTruthy()
		const nav = root.querySelector('.sReels__nav')
		expect(nav?.querySelector('.swiper-pagination')).toBeTruthy()
		expect(root.querySelector('.swiper-button-prev')).toBeTruthy()
		expect(root.querySelector('.swiper-button-next')).toBeTruthy()
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
			path.resolve(__dirname, '..', 'source/pug/blocks/sReels/_sReels.scss'),
			'utf8',
		)
		// rgba(44, 43, 43, x) — окраска scrim/тени по числам Black из UI-Kit
		// (тот же приём #{}-интерполяции без токена недоступен для alpha-подмесей
		// без готового rgba-токена в _root.scss); литеральных HEX здесь нет.
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
