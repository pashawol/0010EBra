/**
 * Pure helpers for the block scaffolder (block.js).
 *
 * Lives in lib/ — a build-tool space that is NOT copied into source/js,
 * so it never ships to a generated site's public/js bundle. This is the
 * project's only pure, Node-testable JS logic, and the Stryker mutation
 * target.
 */

/**
 * Validates that a block name contains only letters, digits and hyphens.
 * @param {string} name
 * @returns {boolean}
 */
export function isValidBlockName(name) {
	return /^(\d|\w|-)+$/.test(name)
}

/**
 * Replaces every {key} occurrence in a template string with value.
 * @param {string} template
 * @param {string} key   - placeholder key (without braces)
 * @param {string} value - replacement value
 * @returns {string}
 */
export function fillTemplate(template, key, value) {
	return template.replace(new RegExp(`\\{${key}}`, 'g'), value)
}
