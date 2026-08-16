import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pug from 'pug'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const read = (rel) => fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf8')

function renderCappedSection() {
	const src = [
		'include source/pug/layout/include.pug',
		'include source/pug/blocks/sAudience/_sAudience.pug',
		'include source/pug/blocks/section-cap/_section-cap.pug',
		'+sAudience()',
		'\t+sectionCap()',
	].join('\n')
	const data = JSON.parse(read('source/pug/data/sAudience.json'))
	return pug.render(src, {
		basedir: PROJECT_ROOT,
		filename: path.join(PROJECT_ROOT, '_fixture.pug'),
		pretty: true,
		...data,
	})
}

describe('section-cap block', () => {
	it('renders inside the owning section, as a direct child (not inside .container)', () => {
		const root = parse(renderCappedSection())
		const section = root.querySelector('.sAudience')
		const cap = section.querySelector('.section-cap')
		expect(cap).toBeTruthy()
		expect(cap.parentNode.classList.contains('sAudience')).toBe(true)
	})

	it('is decorative and stretches with the viewport', () => {
		const cap = parse(renderCappedSection()).querySelector('.section-cap')
		expect(cap.getAttribute('aria-hidden')).toBe('true')

		const svg = cap.querySelector('svg')
		expect(svg.getAttribute('preserveAspectRatio')).toBe('none')
		expect(svg.getAttribute('viewBox')).toBe('0 0 1920 400')
		expect(svg.querySelector('path')?.getAttribute('fill')).toBe('currentColor')
	})

	it('the pinned hero sits below the overlapping section', () => {
		const scss = read('source/pug/blocks/sHero/_sHero.scss')
		expect(scss).toMatch(/position:\s*relative/)
		expect(scss).toMatch(/z-index:\s*0/)
	})

	it('the pin is configured to overlap and to survive a height change', () => {
		const js = read('source/js/hero-overlap.js')
		expect(js).toMatch(/pinSpacing:\s*false/)
		expect(js).toMatch(/start:\s*'bottom bottom'/)
		expect(js).toMatch(/invalidateOnRefresh:\s*true/)
		expect(js).toMatch(/ResizeObserver/)
		expect(js).toMatch(/ScrollTrigger\.refresh\(\)/)
		expect(js).toMatch(/for \(const el of pinned\.children\) ro\.observe\(el\)/)
	})

	it('the overlapping section sits above the pinned hero on an opaque background', () => {
		const scss = read('source/pug/blocks/sAudience/_sAudience.scss')
		expect(scss).toMatch(/position:\s*relative/)
		expect(scss).toMatch(/z-index:\s*1/)
		expect(scss).toMatch(/background-color:\s*var\(--eb-white\)/)
	})

	it('.main-wrapper does not clip overflow on both axes (that breaks scroll effects)', () => {
		const base = read('source/sass/_base.scss')
		const wrapper = base.slice(base.indexOf('.main-wrapper {'))
		const body = wrapper.slice(0, wrapper.indexOf('}'))
		expect(body).not.toMatch(/^\s*overflow:\s*hidden/m)
		expect(body).toMatch(/overflow-x:\s*clip/)
	})

	it('the page wraps hero and the overlapping section into one stack', () => {
		const index = read('source/pug/pages/index.pug')
		expect(index).toMatch(/\.hero-stack\n\s+\+sHero\(\)\n\s+\+sAudience\(\)\n\s+\+sectionCap\(\)/)
	})

	it('the footer overlaps sBooking the same way, with its own cap', () => {
		const index = read('source/pug/pages/index.pug')
		expect(index).toMatch(/\.footer-stack\n\s+\+sectionCap\(\)\.--inflow\n\s+\+footer\(\)/)
		expect(read('source/pug/blocks/sBooking/_sBooking.pug')).toMatch(/data-overlap/)
		expect(read('source/pug/blocks/footer/_footer.scss')).toMatch(
			/\.footer-stack[\s\S]*?\.section-cap[\s\S]*?color: var\(--eb-burgundy\)/,
		)
	})

	it('has no literal hex colors in its stylesheet', () => {
		expect(read('source/pug/blocks/section-cap/_section-cap.scss')).not.toMatch(
			/#[0-9a-fA-F]{3,8}\b/,
		)
	})

	it('matches HTML snapshot', () => {
		const cap = parse(renderCappedSection()).querySelector('.section-cap')
		expect(cap.toString()).toMatchSnapshot()
	})
})
