import path from "path"
import fs from "fs/promises"
import { Client } from "pg"

export class DatabaseManager {
	public dbName: string
	private client: Client
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

	public async connect(): Promise<void> {
		await this.client.connect()
	}

	public async createDatabase(): Promise<void> {
		await this.client.query(`CREATE DATABASE ${this.dbName}`)
		this.client.end()

		// Reconnect with the new database
		this.config.database = this.dbName
		this.client = new Client({ ...this.config, database: this.dbName })
		await this.client.connect()
	}

	public async setupTriggersAndNotifications(): Promise<void> {
		const triggersPath = path.join(__dirname, `triggers.sql`)
		const triggers = await fs.readFile(triggersPath, `utf8`)
		await this.client.query(triggers)
	}

	public async dropDatabase(): Promise<void> {
		await this.client.end()

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

	public async createSampleTable(): Promise<void> {
		await this.client.query(`
        CREATE TABLE your_table (
            id SERIAL PRIMARY KEY,
            data TEXT
        );
    `)
	}

	public async insertSampleData(): Promise<void> {
		const res = await this.client.query(`
				INSERT INTO your_table (data)
				VALUES ('Hello, world!');
		`)
		console.log({ insert: res })
	}

	public async dropSampleTable(): Promise<void> {
		const res = await this.client.query(`DROP TABLE your_table`)
		console.log({ drop: res })
	}
}
