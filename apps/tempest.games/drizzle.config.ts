import { defineConfig } from "drizzle-kit"
import { type } from "arktype"

const dbEnvType = type({
	POSTGRES_HOST: `string`,
	POSTGRES_PORT: `number`,
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
