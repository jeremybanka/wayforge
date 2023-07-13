/// <reference types="vitest" />

import { resolve } from "path"

import { defineConfig } from "vite"
import { configDefaults } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
	test: {
		globals: true,
		exclude: [...configDefaults.exclude, `app`],
	},
	resolve: {
		alias: {
			"~": resolve(__dirname, `..`),
		},
	},
})
