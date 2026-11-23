import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { repoVersion } from './scripts/repo-version.mjs';
export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(repoVersion())
	},
	plugins: [
		sveltekit({
			alias: { $lib: 'src/lib' },
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '200.html',
				strict: false
			})
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		environment: 'node'
	}
});
