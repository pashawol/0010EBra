import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30000,
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:5180',
		headless: true,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		// Build first, then serve the built public/ directory
		command: 'npm run build && npx http-server public -p 5180 -s --cors',
		url: 'http://localhost:5180',
		timeout: 120 * 1000,
		reuseExistingServer: !process.env.CI,
	},
})
