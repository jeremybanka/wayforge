import path from "path"
import fs from "fs/promises"
import { Client } from "pg"

export class DatabaseManager {
	private client: Client
	private dbName: string
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
		this.client = new Client(this.config)
	}

	public async createSampleTable(): Promise<void> {
		await this.client.query(`
        CREATE TABLE your_table (
            id SERIAL PRIMARY KEY,
            data TEXT
        );
    `)
	}

	public async connect(): Promise<void> {
		await this.client.connect()
	}

	public async createDatabase(): Promise<void> {
		await this.client.query(`CREATE DATABASE ${this.dbName}`)
		this.client.end()

		// Reconnect with the new database
		this.config.database = this.dbName
		this.client = new Client(this.config)
		await this.client.connect()
	}

	public async setupTriggersAndNotifications(): Promise<void> {
		const triggersPath = path.join(__dirname, `triggers.sql`)
		const triggers = await fs.readFile(triggersPath, `utf8`)
		await this.client.query(triggers)
	}

	public async dropDatabase(): Promise<void> {
		await this.client.end()

		// Reconnect to the default database to drop the test database
		const adminClient = new Client({
			...this.config,
			database: `postgres`,
		})
		await adminClient.connect()
		await adminClient.query(`DROP DATABASE ${this.dbName}`)
		await adminClient.end()
	}

	public async disconnect(): Promise<void> {
		await this.client.end()
	}

	public async resetDatabase(): Promise<void> {
		// Reset your database state here, e.g., clear tables, reset sequences, etc.
		// this.dropDatabase()
		// this.createDatabase()
		// this.createSampleTable()
		// this.setupTriggersAndNotifications()
	}
}
