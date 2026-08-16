import { describe, it, expect } from 'vitest'
import { parse } from 'node-html-parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderBlock } from './helpers/render-block.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

describe('parallax', () => {
	it('sFitting background is marked for the parallax script', () => {
		const root = parse(renderBlock('sFitting'))
		const img = root.querySelector('.sFitting__bg-photo')
		expect(img).toBeTruthy()
		expect(img.getAttribute('data-parallax')).not.toBeUndefined()
		expect(img.getAttribute('aria-hidden')).toBe('true')
		expect(img.getAttribute('alt')).toBe('')
	})

	it('the image is taller than its box — otherwise the travel would expose an edge', () => {
		const scss = read('source/pug/blocks/sFitting/_sFitting.scss')
		const rule = scss.slice(scss.indexOf('&__bg-photo {'))
		const body = rule.slice(0, rule.indexOf('\n\t}'))
		expect(body).toMatch(/--sFitting-parallax-overflow:\s*\d+%/)
		expect(body).toMatch(/position:\s*absolute/)
		expect(body).toMatch(/height:\s*calc\(100% \+ var\(--sFitting-parallax-overflow\) \* 2\)/)
		expect(body).toMatch(/top:\s*calc\(-1 \* var\(--sFitting-parallax-overflow\)\)/)
	})

	it('the box clips the overflowing image', () => {
		const scss = read('source/pug/blocks/sFitting/_sFitting.scss')
		expect(scss).toMatch(/&__bg\s*\{[\s\S]*?overflow:\s*hidden/)
	})

	it('travel is derived from real heights, not hardcoded', () => {
		const js = read('source/js/parallax.js')
		expect(js).toMatch(/getBoundingClientRect\(\)\.height/)
		expect(js).toMatch(/imgH - boxH/)
		expect(js).toMatch(/if \(!imgH \|\| imgH <= boxH\) return 0/)
		expect(js).toMatch(/invalidateOnRefresh:\s*true/)
		expect(js).toMatch(/ease:\s*'none'/)
	})

	it('respects prefers-reduced-motion and survives a missing GSAP', () => {
		const js = read('source/js/parallax.js')
		expect(js).toMatch(/prefers-reduced-motion: reduce/)
		expect(js).toMatch(/if \(!gsap \|\| !ScrollTrigger\) return/)
	})

	it('is loaded on every page through the shared layout', () => {
		expect(read('source/pug/layout/js-css.pug')).toMatch(/js\/parallax\.js/)
	})
})
