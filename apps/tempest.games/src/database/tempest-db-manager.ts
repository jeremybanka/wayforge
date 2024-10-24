import path from "node:path"

import { Subject } from "atom.io/internal"
import { getTableName } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { drizzle } from "drizzle-orm/postgres-js"
import type { Options } from "postgres"
import postgres from "postgres"

import { env } from "../library/env"
import * as schema from "./tempest-db-schema"
import { games, players, users } from "./tempest-db-schema"

export class DatabaseManager {
	public options: Options<{}>
	public sql: postgres.Sql
	public drizzle: PostgresJsDatabase<typeof schema>
	public observers: Map<string, Subject<string>> = new Map()

	public async setupTriggersAndNotifications(): Promise<void> {
		await this.sql.file(path.resolve(__dirname, `notify_update.sql`))
		const tableNames = [
			getTableName(users),
			getTableName(games),
			getTableName(players),
		]
		await this.sql`SELECT create_notify_triggers(${this.sql.array(tableNames)})`
		await this.sql.listen(`table_update`, (message) => {
			const messageParts = message.split(`,`)
			const tableName = messageParts[0]
			const recordId = messageParts[1]
			const completeKey = `${tableName}("${recordId}")`
			if (this.observers.has(completeKey)) {
				// biome-ignore lint/style/noNonNullAssertion: has
				this.observers.get(completeKey)!.next(completeKey)
			}
		})
	}

	public constructor(
		options: Options<{}> = {
			host: env.POSTGRES_HOST,
			port: env.POSTGRES_PORT,
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			database: env.POSTGRES_DATABASE,
		},
	) {
		this.options = options
		this.sql = postgres(options)
		this.drizzle = drizzle(this.sql, { schema, logger: true })
	}

	public observe(completeKey: string, callback: () => void): void {
		if (!this.observers.has(completeKey)) {
			this.observers.set(completeKey, new Subject<string>())
		}
		// biome-ignore lint/style/noNonNullAssertion: has
		this.observers.get(completeKey)!.subscribe(`SINGLETON`, callback)
	}
}
