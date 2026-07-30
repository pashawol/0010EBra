import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.js', 'tests/**/*.test.ts', 'source/pug/blocks/**/*.test.js'],
		globals: true,
		// Property-based тесты компилируют Pug на каждый прогон fast-check и упираются
		// в дефолтные 5000 мс: изолированно проходят, в полном прогоне падают по таймауту.
		testTimeout: 30000,
	},
})
