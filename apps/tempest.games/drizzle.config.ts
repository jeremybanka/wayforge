import { type } from "arktype"
import { defineConfig } from "drizzle-kit"

const dbEnvType = type({
	POSTGRES_HOST: `string`,
	POSTGRES_PORT: type(`string`).pipe((s) => Number.parseInt(s, 10)),
	POSTGRES_USER: `string`,
	POSTGRES_PASSWORD: `string`,
	POSTGRES_DATABASE: `string`,
})

const dbEnv = dbEnvType(process.env)

if (dbEnv instanceof type.errors) {
	throw new Error(`Invalid db env: ${dbEnv.toString()}`)
}

const dbCredentials = {
	host: dbEnv.POSTGRES_HOST,
	port: dbEnv.POSTGRES_PORT,
	user: dbEnv.POSTGRES_USER,
	password: dbEnv.POSTGRES_PASSWORD,
	database: dbEnv.POSTGRES_DATABASE,
}

export default defineConfig({
	dialect: `postgresql`,
	schema: `./src/database/tempest-db-schema.ts`,
	out: `./drizzle`,
	dbCredentials,
})
