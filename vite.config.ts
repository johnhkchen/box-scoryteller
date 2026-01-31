import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tools/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	},
	resolve: {
		alias: {
			// Redirect BAML imports to our ESM compatibility wrapper
			'@boundaryml/baml': resolve(__dirname, 'src/lib/baml-compat.mjs')
		}
	},
	server: {
		allowedHosts: ['.trycloudflare.com']
	}
});
