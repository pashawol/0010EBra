import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Rules relaxed with a documented reason:
//
// 'list' — the demo breadcrumb component renders `<ol class="breadcrumb swiper-wrapper">`
//           (a Swiper carousel applied to a breadcrumb) on 00-modal.html. axe flags this
//           STATICALLY: the Swiper wrapper markup makes the <ol> have children that aren't
//           plain <li>. This is a demo-only pattern; index.html has no such markup. Disabling
//           is scoped to tolerate the demo breadcrumb, not a real content list.
//           (Earlier this was wrongly attributed to runtime Swiper role injection — it's static.)
//
// NOTE: 'aria-input-field-name' was previously disabled to hide unlabeled form-wrap inputs
//       on the modal / 00-modal pages. That was a real, fixable defect — the inputs now carry
//       <label>s (see _modal.pug / 00-modal.pug), so the rule is enforced again.

const ALLOWED_RULES = ['list']

const PAGES = [
	{ name: 'index', path: '/' },
	{ name: '00-modal', path: '/00-modal.html' },
	{ name: '01-ui-kit', path: '/01-ui-kit.html' },
]

for (const { name, path } of PAGES) {
	test(`${name} — no critical/serious axe-core violations`, async ({ page }) => {
		await page.goto(path)

		const results = await new AxeBuilder({ page })
			// Run against critical and serious only; moderate/minor are informational
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.disableRules(ALLOWED_RULES)
			// Exclude the select2-generated combobox widgets. The underlying native
			// <select> IS labelled (see 00-modal.pug); select2 rebuilds it as its own
			// role="combobox" span and its multi-select variant has a known upstream
			// naming gap. Scope: only the vendor widget is exempt — aria-input-field-name
			// stays ENABLED for all author-authored inputs.
			.exclude('.select2-container')
			.analyze()

		const criticalOrSerious = results.violations.filter((v) =>
			['critical', 'serious'].includes(v.impact),
		)

		if (criticalOrSerious.length > 0) {
			// Print a human-readable summary to help diagnose failures
			const summary = criticalOrSerious
				.map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
				.join('\n')
			console.error(`Axe violations on ${path}:\n${summary}`)
		}

		expect(criticalOrSerious).toHaveLength(0)
	})
}
