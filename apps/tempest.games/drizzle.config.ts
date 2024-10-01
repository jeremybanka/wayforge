import { defineConfig } from "drizzle-kit"

export default defineConfig({
	dialect: `postgresql`,
	schema: `./src/database/tempest-db-schema.ts`,
	out: `./drizzle`,
})
