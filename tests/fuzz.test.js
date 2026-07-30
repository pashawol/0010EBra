/**
 * Property-based / fuzz layer using fast-check.
 *
 * Strategy: pass hostile data via pug `locals` (renderFile with variable locals),
 * NOT via string interpolation into pug source — that would only trigger pug
 * syntax errors before any mixin ever runs. Locals are the correct boundary.
 *
 * Fixtures that use locals live in tests/fixtures/.
 *
 * Targets:
 *   1. form-wrap `+input(placeholder, inputType, label)` mixin
 *   2. sCatalog  `+product-item(imgIdx, title, text, price)` mixin
 *
 * Invariants checked for every generated input:
 *   a) render never throws
 *   b) output is structurally valid HTML (node-html-parser can parse it)
 *   c) hostile input is escaped: no injected active content (script/img/iframe)
 *      and no on*-handler attribute reaches the output (covers both the bare
 *      `<script>` and the `"><img onerror=...>` attribute-breakout vectors)
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { parse } from 'node-html-parser'
import pug from 'pug'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// Fixture paths
const INPUT_FIXTURE = path.join(__dirname, 'fixtures', 'fuzz-input.pug')

const RENDER_OPTS = { basedir: PROJECT_ROOT, pretty: true }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isStructurallyValid(html) {
	try {
		const root = parse(html)
		return root.childNodes.length > 0
	} catch {
		return false
	}
}

/**
 * The input fixture legitimately renders only <label>/<span>/<input>.
 * So if any active-content element (script/img/iframe) OR any element
 * carrying an on*-event-handler attribute appears, it can only have come
 * from hostile input that escaped Pug's text/attribute escaping.
 * Catches both the bare `<script>` and the `"><img onerror=...>` vectors.
 */
function noInjectedActiveContent(html) {
	const root = parse(html)
	const active =
		root.querySelectorAll('script').length +
		root.querySelectorAll('img').length +
		root.querySelectorAll('iframe').length
	if (active > 0) return false
	return !root
		.querySelectorAll('*')
		.some((el) => Object.keys(el.attributes).some((attr) => /^on/i.test(attr)))
}

// ---------------------------------------------------------------------------
// Arbitrary for hostile strings
// ---------------------------------------------------------------------------
const hostileString = fc.oneof(
	fc.constant(''),
	fc.constant('<script>alert(1)</script>'),
	fc.constant('&amp; "quoted" \'single\''),
	fc.constant('<b>bold</b>'),
	fc.constant('😀🚀🎉'),
	fc.constant('a'.repeat(500)),
	fc.constant('\n\t\r'),
	fc.constant('"><img src=x onerror=alert(1)>'),
	fc.string({ minLength: 0, maxLength: 200 }),
)

// ---------------------------------------------------------------------------
// form-wrap input mixin — fuzz placeholder and label via locals
// ---------------------------------------------------------------------------
describe('form-wrap input mixin — property-based', () => {
	it('never throws for any placeholder/label combination', () => {
		fc.assert(
			fc.property(hostileString, hostileString, (placeholder, label) => {
				expect(() =>
					pug.renderFile(INPUT_FIXTURE, {
						...RENDER_OPTS,
						placeholder,
						inputType: 'text',
						label,
					}),
				).not.toThrow()
			}),
			{ numRuns: 100 },
		)
	})

	it('always produces structurally valid HTML', () => {
		fc.assert(
			fc.property(hostileString, hostileString, (placeholder, label) => {
				const html = pug.renderFile(INPUT_FIXTURE, {
					...RENDER_OPTS,
					placeholder,
					inputType: 'text',
					label,
				})
				expect(isStructurallyValid(html)).toBe(true)
			}),
			{ numRuns: 100 },
		)
	})

	it('escapes hostile input — no injected script/img/iframe or on* handler via placeholder or label', () => {
		fc.assert(
			fc.property(hostileString, hostileString, (placeholder, label) => {
				const html = pug.renderFile(INPUT_FIXTURE, {
					...RENDER_OPTS,
					placeholder,
					inputType: 'text',
					label,
				})
				expect(noInjectedActiveContent(html)).toBe(true)
			}),
			{ numRuns: 100 },
		)
	})
})

// ---------------------------------------------------------------------------
// sCatalog product-item mixin — fuzz title / text / price via locals
//
// NOTE: _sCatalog.pug uses `!= t` / `!= p` / `!= pr` (unescaped interpolation).
// This is a deliberate design choice (allows HTML markup in product copy).
// We document this here and fuzz only the invariants that hold for != output:
//   - render never throws
//   - output is structurally parseable (may contain HTML from the input on purpose)
// ---------------------------------------------------------------------------
// property-based тест product-item удалён вместе с демо-блоком sCatalog.
