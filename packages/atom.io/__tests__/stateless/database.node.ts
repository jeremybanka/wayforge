import path from "path"
import postgres from "postgres"

export class DatabaseManager {
	public dbName = `test_db_` + Date.now()
	private config = {
		user: `postgres`,
		host: process.env.GITHUB_ACTION ? `postgres` : `localhost`,
		database: `postgres`,
		password: `your_password`,
		port: 5432,
	}
	private sql = postgres(this.config)

	public async createDatabase(): Promise<void> {
		await this.sql`CREATE DATABASE ${this.sql(this.dbName)}`
		this.sql.end()
		this.config.database = this.dbName
		this.sql = postgres(this.config)
	}

	public async setupTriggersAndNotifications(): Promise<void> {
		const triggersPath = path.join(__dirname, `triggers.sql`)
		await this.sql.file(triggersPath)
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

	public async createSampleTable(): Promise<void> {
		await this.sql`
		  CREATE TABLE your_table (
		      id SERIAL PRIMARY KEY,
		      data TEXT
		  );
		`
	}

	public async insertSampleData(): Promise<void> {
		await this.sql`
      INSERT INTO your_table (data)
      VALUES ('Hello, world!')
      RETURNING *;
    `
	}

	public async dropSampleTable(): Promise<void> {
		await this.sql`DROP TABLE your_table`
	}
}
