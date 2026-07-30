/**
 * Unit tests for lib/utils.js — the pure helpers used by the block.js
 * scaffolder, and the Stryker mutation target.
 *
 * source/js (JSCCommon.js, common.js) is browser jQuery glue requiring
 * window/document/Fancybox/Swiper/$ and is not unit-testable in Node.
 */
import { describe, it, expect } from 'vitest'
import { fillTemplate, isValidBlockName } from '../lib/utils.js'

// ---------------------------------------------------------------------------
// isValidBlockName
// ---------------------------------------------------------------------------
describe('isValidBlockName', () => {
	it('accepts letters only', () => {
		expect(isValidBlockName('myBlock')).toBe(true)
	})

	it('accepts digits', () => {
		expect(isValidBlockName('block123')).toBe(true)
	})

	it('accepts hyphens', () => {
		expect(isValidBlockName('my-block-name')).toBe(true)
	})

	it('accepts a single character', () => {
		expect(isValidBlockName('a')).toBe(true)
	})

	it('rejects empty string', () => {
		expect(isValidBlockName('')).toBe(false)
	})

	it('rejects spaces', () => {
		expect(isValidBlockName('my block')).toBe(false)
	})

	it('rejects dots', () => {
		expect(isValidBlockName('my.block')).toBe(false)
	})

	it('rejects slashes', () => {
		expect(isValidBlockName('my/block')).toBe(false)
	})
})

// ---------------------------------------------------------------------------
// fillTemplate
// ---------------------------------------------------------------------------
describe('fillTemplate', () => {
	it('replaces a single placeholder', () => {
		expect(fillTemplate('Hello {name}', 'name', 'World')).toBe('Hello World')
	})

	it('replaces all occurrences', () => {
		expect(fillTemplate('{x} and {x}', 'x', 'foo')).toBe('foo and foo')
	})

	it('does not touch unrelated placeholders', () => {
		expect(fillTemplate('{a} {b}', 'a', 'X')).toBe('X {b}')
	})

	it('returns original string when key not found', () => {
		expect(fillTemplate('hello', 'missing', 'val')).toBe('hello')
	})

	it('handles empty value', () => {
		expect(fillTemplate('{blockName}.scss', 'blockName', '')).toBe('.scss')
	})

	it('fills the block scaffold templates the way block.js relies on', () => {
		// pins the exact contract block.js uses: replace every {blockName}
		expect(fillTemplate('mixin {blockName}\n.{blockName}#{blockName}', 'blockName', 'hero')).toBe(
			'mixin hero\n.hero#hero',
		)
	})
})
