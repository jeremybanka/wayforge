#!/usr/bin/env bun

import * as os from "node:os"

import postgres from "postgres"

import { env } from "../src/library/env.ts"

const PRETTY_PLEASE = process.env.PRETTY_PLEASE

if (!PRETTY_PLEASE) {
	console.warn(`🚨 this is a dangerous script, please ask nicely`)
	process.exit(1)
}

const osUser = os.userInfo().username
const user = osUser === `unknown` ? `postgres` : osUser

const sql = postgres({
	user,
	password: env.POSTGRES_PASSWORD,
	database: `postgres`,
	host: env.POSTGRES_HOST,
	port: env.POSTGRES_PORT,
})

await sql.unsafe(`DROP DATABASE ${env.POSTGRES_DATABASE};`)

await sql.end()
