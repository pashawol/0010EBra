import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/sStory.json')

// Тот же паттерн, что у sExpertise/sHero/sProcess: `data = data || sStory`
// в миксине читает глобальный pug-local, который в проде даёт gulp-data,
// а тут — фикстура из того же JSON.
const { sStory: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

function render() {
	return renderBlock('sStory', { locals: { sStory: fixtureData } })
}

// ---------------------------------------------------------------------------
// sStory block — node 218:361 (desktop) / 710:2046 (mobile, внутри 692:1129)
// ---------------------------------------------------------------------------
describe('sStory block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('renders one slide per story with the swiper scaffolding', () => {
		const root = parse(render())
		const section = root.querySelector('section.sStory')
		expect(section).toBeTruthy()
		expect(section.getAttribute('data-swiper-scope')).not.toBeNull()

		const slides = root.querySelectorAll('.swiper-slide')
		expect(slides.length).toBe(fixtureData.stories.length)
	})

	it('renders an independent before/after comparator per slide', () => {
		const root = parse(render())
		const compares = root.querySelectorAll('[data-story-compare]')
		expect(compares.length).toBe(fixtureData.stories.length)

		for (const compare of compares) {
			const before = compare.querySelector('.sStory__photo--before img')
			const after = compare.querySelector('.sStory__photo--after img')
			expect(before?.getAttribute('src')).toBeTruthy()
			expect(after?.getAttribute('src')).toBeTruthy()
			expect(before.getAttribute('loading')).toBe('lazy')
			expect(after.getAttribute('loading')).toBe('lazy')

			// Ручка — swiper-no-swiping, иначе внешний Swiper перехватывает
			// pointerdown вместо сдвига границы (грабля, зафиксирована в JS).
			const handleBtn = compare.querySelector('.sStory__handle-btn')
			expect(handleBtn).toBeTruthy()
			expect(handleBtn.classList.contains('swiper-no-swiping')).toBe(true)
			expect(handleBtn.getAttribute('role')).toBe('slider')
		}
	})

	it('renders the story card content (name, params, quote)', () => {
		const root = parse(render())
		const firstCard = root.querySelectorAll('.sStory__card')[0]
		expect(firstCard.querySelector('.sStory__name-value')?.text.trim()).toBe(
			fixtureData.stories[0].name,
		)
		const rows = firstCard.querySelectorAll('.sStory__info-row')
		expect(rows.length).toBe(fixtureData.stories[0].params.length)
		expect(firstCard.querySelector('.sStory__quote-text')?.text.trim()).toBe(
			fixtureData.stories[0].quote,
		)
	})

	it('renders the slider nav with pagination and both arrows, no duplicated classes', () => {
		const html = render()
		const root = parse(html)
		const nav = root.querySelectorAll('.sStory__nav')[0]
		expect(nav?.querySelector('.swiper-pagination')).toBeTruthy()
		expect(root.querySelector('.swiper-button-prev')).toBeTruthy()
		expect(root.querySelector('.swiper-button-next')).toBeTruthy()

		// Грабля bemto: модификатор должен передаваться ведущим чейном
		// (см. _sStory.pug), иначе html-validate валит сборку на no-dup-class.
		for (const el of root.querySelectorAll('[class]')) {
			const classes = el.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
		}
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/sStory/_sStory.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
