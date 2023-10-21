import path from "path"
import fs from "fs/promises"
import postgres from "postgres"

export class DatabaseManager {
	public dbName: string
	private sql: ReturnType<typeof postgres>
	private config: {
		user: string
		host: string
		database: string
		password: string
		port: number
	}

	public constructor() {
		this.dbName = `test_db_` + Date.now() // Unique DB name for each test run
		this.config = {
			user: `postgres`, // Default user; adjust if needed
			host: process.env.GITHUB_ACTION ? `postgres` : `localhost`,
			database: `postgres`, // Default database to execute administrative commands
			password: `your_password`, // Set your postgres user's password
			port: 5432,
		}
		this.sql = postgres(this.config)
	}

	public async connect(): Promise<void> {
		// With postgres.js, the connection is lazy and will only be established once the first query is executed.
		// Therefore, no explicit connection step is required.
	}

	public async createDatabase(): Promise<void> {
		await this.sql`CREATE DATABASE ${this.sql(this.dbName)}`
		this.sql.end()

		// Reconnect with the new database
		this.config.database = this.dbName
		this.sql = postgres(this.config)
	}

	public async setupTriggersAndNotifications(): Promise<void> {
		const triggersPath = path.join(__dirname, `triggers.sql`)
		const triggers = await fs.readFile(triggersPath, `utf8`)
		await this.sql.file(triggersPath) // Use file method to execute SQL file
	}

	public async dropDatabase(): Promise<void> {
		this.sql.end()

		const adminSql = postgres({
			...this.config,
			database: `postgres`,
		})
		await adminSql`DROP DATABASE ${this.sql(this.dbName)}`
		adminSql.end()
	}

	public async disconnect(): Promise<void> {
		this.sql.end()
	}

	public async createSampleTable(): Promise<void> {
		await this.sql`
      CREATE TABLE your_table (
          id SERIAL PRIMARY KEY,
          data TEXT
      );
    `
	}

	public async insertSampleData(): Promise<void> {
		const res = await this.sql`
      INSERT INTO your_table (data)
      VALUES ('Hello, world!')
      RETURNING *;
    `
		console.log({ insert: res })
	}

	public async dropSampleTable(): Promise<void> {
		const res = await this.sql`DROP TABLE your_table`
		console.log({ drop: res })
	}
}
