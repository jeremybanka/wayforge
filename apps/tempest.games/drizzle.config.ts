import dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"
import { z } from "zod"

dotenv.config()

const dbCredentials = z
	.object({
		POSTGRES_HOST: z.string(),
		POSTGRES_PORT: z.string().transform((s) => Number.parseInt(s, 10)),
		POSTGRES_USER: z.string(),
		POSTGRES_PASSWORD: z.string(),
		POSTGRES_DATABASE: z.string(),
	})
	.transform((env) => ({
		host: env.POSTGRES_HOST,
		port: env.POSTGRES_PORT,
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		database: env.POSTGRES_DATABASE,
	}))
	.parse(process.env)

export default defineConfig({
	dialect: `postgresql`,
	schema: `./src/database/tempest-db-schema.ts`,
	out: `./drizzle`,
	dbCredentials,
})
