#!/usr/bin/env bun

import * as os from "node:os"

import postgres from "postgres"

import { env } from "../src/library/env.ts"

const osUser = os.userInfo().username
const user = osUser === `unknown` ? `postgres` : osUser

const sql = postgres({
	user,
	password: env.POSTGRES_PASSWORD,
	database: `postgres`,
	host: env.POSTGRES_HOST,
	port: env.POSTGRES_PORT,
})

try {
	process.stdout.write(`🚀 Creating database ${env.POSTGRES_DATABASE}... `)
	await sql`CREATE DATABASE ${sql(env.POSTGRES_DATABASE)}`
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed:`, thrown.message)
	}
}

try {
	process.stdout.write(`🚀 Creating user ${env.POSTGRES_USER}... `)
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
	process.stdout.write(
		`🚀 Granting privileges to ${env.POSTGRES_USER} on ${env.POSTGRES_DATABASE}... `,
	)
	await sql`GRANT ALL PRIVILEGES ON DATABASE ${sql(env.POSTGRES_DATABASE)} TO ${sql(
		env.POSTGRES_USER,
	)}`
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed:`, thrown.message)
	}
}

import { resolve } from "node:path"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"

try {
	process.stdout.write(`🚀 Migrating database ${env.POSTGRES_DATABASE}... `)
	const db = drizzle(sql)
	await migrate(db, { migrationsFolder: resolve(import.meta.dir, `../drizzle`) })
	console.log(`Done!`)
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(`💥 Failed:`, thrown.message)
	}
}

await sql.end()
console.log(`🚀 Database connection closed`)
