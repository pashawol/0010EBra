import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

describe('reveal', () => {
	it('sFitting decorative arrows and hotspots are marked for reveal', () => {
		const root = parse(renderBlock('sFitting'))
		expect(root.querySelectorAll('.sFitting__arrow[data-reveal]').length).toBe(2)
		expect(root.querySelectorAll('.eb-hotspot[data-reveal]').length).toBe(
			root.querySelectorAll('.eb-hotspot').length,
		)
	})

	it('every hotspot on the page is marked, wherever it is used', () => {
		for (const block of ['sHero', 'sCollection']) {
			const root = parse(renderBlock(block))
			const spots = root.querySelectorAll('.eb-hotspot')
			expect(spots.length).toBeGreaterThan(0)
			for (const el of spots) expect(el.getAttribute('data-reveal')).not.toBeUndefined()
		}
	})

	it('is driven by scroll progress and rewinds when scrolled back', () => {
		const js = read('source/js/reveal.js')
		expect(js).toMatch(/scrub: 0\.6/)
		expect(js).toMatch(/start,\n\t\t\t\t\tend,/)
		expect(js).toMatch(/autoAlpha: 0/)
		expect(js).toMatch(/autoAlpha: 1/)
		expect(js).not.toMatch(/toggleActions/)
	})

	it('animates through gsap only — no global css layer to clash with block styles', () => {
		expect(fs.existsSync(path.resolve(__dirname, '..', 'source/pug/blocks/reveal'))).toBe(false)
		expect(read('public/css/main.min.css')).not.toMatch(/\[data-reveal\]/)
		expect(read('source/js/reveal.js')).toMatch(/overwrite: 'auto'/)
	})

	it('defaults to coming from the bottom', () => {
		const js = read('source/js/reveal.js')
		expect(js).toMatch(/AXIS\[el\.getAttribute\('data-reveal'\)\] \|\| AXIS\.bottom/)
		expect(js).toMatch(/setAttribute\('data-reveal', 'bottom'\)/)
		expect(js).toMatch(/getAttribute\('data-reveal-from'\) \|\| 'bottom'/)
	})

	it('leaves content visible without gsap or with reduced motion', () => {
		const js = read('source/js/reveal.js')
		expect(js).toMatch(/prefers-reduced-motion: reduce/)
		expect(js).toMatch(/\.matches\) return/)
		expect(js).toMatch(/if \(!gsap \|\| !ScrollTrigger\) return/)
	})

	it('groups get one trigger and a native gsap stagger', () => {
		const js = read('source/js/reveal.js')
		expect(js).toMatch(/data-reveal-group/)
		expect(js).toMatch(/data-reveal-stagger/)
		expect(js).toMatch(/:not\(\[data-reveal-in-group\]\)/)
		expect(js).toMatch(/stagger,/)
	})

	it('picks up the by-convention targets that anim.js used to handle', () => {
		const js = read('source/js/reveal.js')
		expect(js).toMatch(/\.eb-title, \.eb-fact/)
		expect(js).toMatch(/data-anim="reveal"/)
		expect(js).toMatch(/main > section/)
		const anim = read('source/js/anim.js')
		expect(anim).not.toMatch(/revealOnEnter|parallaxMedia/)
	})

	it('sQuiz reveals every message and button on its own', () => {
		const html = renderBlock('sQuiz')
		const root = parse(html)
		const group = root.querySelector('[data-reveal-group]')
		expect(group).toBeTruthy()
		const selector = group.getAttribute('data-reveal-group')
		for (const part of ['__bubble', '__cta', '__row-label', '__avatar']) {
			expect(selector).toContain(part)
		}
		expect(read('source/js/anim-transition-3.js')).not.toMatch(/incomingQuiz/)
	})

	it('is loaded through the shared layout', () => {
		expect(read('source/pug/layout/js-css.pug')).toMatch(/js\/reveal\.js/)
	})
})
