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
	await sql`CREATE DATABASE ${sql(env.POSTGRES_DATABASE)}`
	await sql`CREATE USER ${sql(env.POSTGRES_USER)} WITH PASSWORD ${env.POSTGRES_PASSWORD}`
} catch (thrown) {
	if (thrown instanceof Error) {
		console.error(thrown.message)
	}
}

await sql`
  GRANT ALL PRIVILEGES ON DATABASE ${sql(env.POSTGRES_DATABASE)} TO ${sql(env.POSTGRES_USER)}
`

await sql.end()
