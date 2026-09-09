import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

describe('hotspot viewport clamp', () => {
	it('is opt-in, so hotspots in carousels and other blocks keep their own layout', () => {
		const js = read('source/js/hotspot-fit.js')
		expect(js).toMatch(/\[data-hotspot-fit\] \.eb-hotspot__card/)
		expect(js).not.toMatch(/querySelectorAll\('\.eb-hotspot__card'\)/)
	})

	it('clears its own shift before measuring, so resizes do not accumulate', () => {
		const js = read('source/js/hotspot-fit.js')
		const reset = js.indexOf("setProperty('--hs-fit-shift', '0px')")
		const measure = js.indexOf('getBoundingClientRect')
		expect(reset).toBeGreaterThan(-1)
		expect(measure).toBeGreaterThan(reset)
	})

	it('clamps to the right edge but never pushes a card off the left one', () => {
		const js = read('source/js/hotspot-fit.js')
		expect(js).toMatch(/if \(box\.right > limit\) shift = limit - box\.right/)
		expect(js).toMatch(/if \(box\.left \+ shift < GAP\) shift = GAP - box\.left/)
	})

	it('recomputes on resize and on late layout changes', () => {
		const js = read('source/js/hotspot-fit.js')
		expect(js).toMatch(/addEventListener\('resize'/)
		expect(js).toMatch(/ResizeObserver/)
		expect(js).toMatch(/requestAnimationFrame/)
	})

	it('the card carries the shift and defaults to no offset', () => {
		const scss = read('source/pug/blocks/mixin-wrap/components/eb-ui.scss')
		expect(scss).toMatch(/transform: translateX\(var\(--hs-fit-shift, 0px\)\)/)
	})

	it('is loaded on every page through the shared layout', () => {
		expect(read('source/pug/layout/js-css.pug')).toMatch(/js\/hotspot-fit\.js/)
	})
})
