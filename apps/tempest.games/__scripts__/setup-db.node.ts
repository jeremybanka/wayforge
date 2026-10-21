#!/usr/bin/env node

import * as os from "node:os"
import { resolve } from "node:path"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import type { Options as PostgresOptions } from "postgres"
import postgres from "postgres"

import type * as schema from "../src/database/tempest-db-schema.ts"
import { env } from "../src/library/env.ts"

const osUser = os.userInfo().username
const user = osUser === `runner` ? `postgres` : osUser

const postgresSetupCredentials = {
	user,
	password: env.POSTGRES_PASSWORD,
	database: `postgres`,
	host: env.POSTGRES_HOST,
	port: env.POSTGRES_PORT,
} satisfies PostgresOptions<{}>

const sql = postgres(postgresSetupCredentials)

try {
	console.log(`🚀 Creating database ${env.POSTGRES_DATABASE}... `)
	await sql`CREATE DATABASE ${sql(env.POSTGRES_DATABASE)}`
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed:`, thrown.message)
	}
}

try {
	console.log(`🚀 Creating user ${env.POSTGRES_USER}... `)
	await sql.unsafe(
		`CREATE USER ${env.POSTGRES_USER} WITH PASSWORD '${env.POSTGRES_PASSWORD}'`,
	)
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed:`, thrown.message)
	}
}

try {
	console.log(
		`🚀 Changing owner of ${env.POSTGRES_DATABASE} to ${env.POSTGRES_USER}...`,
	)
	await sql.unsafe(
		`ALTER DATABASE ${env.POSTGRES_DATABASE} OWNER TO ${env.POSTGRES_USER}`,
	)
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed to change ownership:`, thrown.message)
	}
}
await sql.end()

const tempest = postgres({
	user: env.POSTGRES_USER,
	password: env.POSTGRES_PASSWORD,
	database: env.POSTGRES_DATABASE,
	host: env.POSTGRES_HOST,
	port: env.POSTGRES_PORT,
})
try {
	console.log(`🚀 Migrating database ${env.POSTGRES_DATABASE}... `)
	const db = drizzle<typeof schema>(tempest)
	await migrate(db, {
		migrationsFolder: resolve(import.meta.dirname, `../drizzle`),
	})
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed:`, thrown.message)
	}
}
await tempest.end()

console.log(`🚀 Database connection closed`)
