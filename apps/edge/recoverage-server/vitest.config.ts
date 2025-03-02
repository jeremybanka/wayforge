import path from "node:path"

import {
	defineWorkersProject,
	readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersProject(async () => {
	const migrationsPath = path.join(import.meta.dirname, `drizzle`)
	const migrations = await readD1Migrations(migrationsPath)

	return {
		test: {
			setupFiles: [`./__tests__/apply-migrations.ts`],
			globals: true,
			poolOptions: {
				workers: {
					main: `./src/index.tsx`,
					wrangler: { configPath: `./wrangler.jsonc` },
					miniflare: {
						// Add a test-only binding for migrations, so we can apply them in a
						// setup file
						bindings: { TEST_MIGRATIONS: migrations },
					},
				},
			},
		},
	}
})
