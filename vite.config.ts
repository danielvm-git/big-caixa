import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { repoVersion } from './scripts/repo-version.mjs';
import { sqliteCollections } from './scripts/sqlite-collections.mjs';

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(repoVersion())
	},
	plugins: [
		{
			name: 'sqlite-collections',
			configureServer(server) {
				server.middlewares.use(sqliteCollections());
			}
		},
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
