import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			reporter: [`text`, `json`],
			include: [`*.ts`],
			exclude: [`*.config.ts`, `*.test.ts`],
		},
	},
})
