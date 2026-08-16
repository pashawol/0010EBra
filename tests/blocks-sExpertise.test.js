import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '..', 'source/pug/data/sExpertise.json')

// The block reads `data = data || sExpertise` (same pattern as sHero/sProcess/
// sTransformIntro). render-block.js has no gulp-data merge step (that only
// happens in the real gulp pug task), so the fixture must inject the same
// source/pug/data/sExpertise.json payload via pug locals, exactly like
// production does via gulp-data.
const { sExpertise: fixtureData } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

function render() {
	return renderBlock('sExpertise', { locals: { sExpertise: fixtureData } })
}

// ---------------------------------------------------------------------------
// sExpertise block — node 344:1379 (desktop) / 726:99 (mobile)
// ---------------------------------------------------------------------------
describe('sExpertise block', () => {
	it('renders without throwing', () => {
		expect(() => render()).not.toThrow()
	})

	it('matches HTML snapshot', () => {
		expect(render()).toMatchSnapshot()
	})

	it('is a dark-theme full-bleed section', () => {
		const root = parse(render())
		const section = root.querySelector('section.sExpertise')
		expect(section).toBeTruthy()
		expect(section.classList.contains('eb-theme--dark')).toBe(true)
	})

	it('renders the title with a line break', () => {
		const root = parse(render())
		const title = root.querySelector('.sExpertise__title h2')
		expect(title).toBeTruthy()
		expect(title.innerHTML).toContain('<br>')
	})

	it('renders the fact block (100+) and the mobile tag', () => {
		const root = parse(render())
		const factValue = root.querySelector('.sExpertise__fact .eb-fact__value')
		expect(factValue?.text.trim()).toBe('100+')
		const mobileTag = root.querySelector('.sExpertise__mobile-tag .eb-tag__label')
		expect(mobileTag?.text.trim()).toBe('О нас')
	})

	it('renders at least one slide with a lazy-loaded, described photo', () => {
		const root = parse(render())
		const slides = root.querySelectorAll('.swiper-slide')
		expect(slides.length).toBeGreaterThanOrEqual(1)
		const photo = root.querySelector('.sExpertise__photo')
		expect(photo).toBeTruthy()
		expect(photo.getAttribute('loading')).toBe('lazy')
		expect(photo.getAttribute('alt')).toBe('')
	})

	it('renders the slider nav with pagination and both arrows, no duplicated classes', () => {
		const html = render()
		const root = parse(html)
		const nav = root.querySelector('.sExpertise__nav')
		expect(nav?.querySelector('.swiper-pagination')).toBeTruthy()
		expect(root.querySelector('.swiper-button-prev')).toBeTruthy()
		expect(root.querySelector('.swiper-button-next')).toBeTruthy()

		// Guard against the bemto "raw modifier string" pitfall (grabля):
		// no element in the block should carry the same class twice.
		for (const el of root.querySelectorAll('[class]')) {
			const classes = el.getAttribute('class').trim().split(/\s+/)
			expect(new Set(classes).size).toBe(classes.length)
		}
	})

	it('has no literal hex colors in its stylesheet', () => {
		const scss = fs.readFileSync(
			path.resolve(__dirname, '..', 'source/pug/blocks/sExpertise/_sExpertise.scss'),
			'utf8',
		)
		expect(scss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
	})
})
