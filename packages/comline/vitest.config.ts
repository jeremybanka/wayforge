import { fileURLToPath } from "node:url"

import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

import { shellSource } from "./shell-source.config.ts"

const config: UserConfig = defineConfig({
	plugins: [
		shellSource,
		{
			name: `comline-contract-package-fixtures`,
			transform(code, id) {
				if (
					!id
						.replace(/\\/g, `/`)
						.endsWith(`/__tests__/fixtures/completion-shells.ts`)
				)
					return
				// Keep released assertions and shell readers intact. Only adapt
				// the producer path, which formerly required a dependency build.
				const producer =
					/path\.join\(packageDirectory,\s*[`"']\.\.\/treetrunks[`"']\)/
				if (!producer.test(code))
					throw new Error(`Unrecognized TreeTrunks fixture producer in ${id}`)
				const adapter = fileURLToPath(
					new URL(`./test-infrastructure/source-workspace.ts`, import.meta.url),
				)
				return `import { stageTreeTrunks } from ${JSON.stringify(adapter)};\n${code.replace(producer, `stageTreeTrunks(packageDirectory, path.join(directory, "treetrunks-workspace"), (args, cwd) => run("pnpm", args, environment, cwd))`)}`
			},
		},
	],
	test: {
		alias: {
			treetrunks: fileURLToPath(
				new URL(`../treetrunks/src/treetrunks.ts`, import.meta.url),
			),
		},
		globals: true,
		coverage: {
			provider: `v8`,
			reporter: [`text`, `lcov`, `json`],
			include: [`src/**/*.ts`],
		},
	},
})

export default config
