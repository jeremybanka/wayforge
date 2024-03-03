import path from "path"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { cities, countries } from "./schema.node"

export class DatabaseManager {
	public dbName = `test_db_` + Date.now()
	private config = {
		user: `postgres`,
		host: `localhost`,
		database: `postgres`,
		password: `your_password`,
		port: 5432,
	}
	private sql = postgres(this.config)
	private drizzle = drizzle(this.sql)

	public async createDatabase(): Promise<void> {
		await this.sql`CREATE DATABASE ${this.sql(this.dbName)}`
		this.sql.end()
		this.config.database = this.dbName
		this.sql = postgres(this.config)
		this.drizzle = drizzle(this.sql)
	}

	public async setupTriggersAndNotifications(): Promise<void> {
		await this.sql.file(path.join(__dirname, `notify_update.sql`))
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

	public async createSampleTables(): Promise<void> {
		await this.sql`
		  CREATE TABLE countries (
				id SERIAL PRIMARY KEY,
				name TEXT
		  );
		`
		await this.sql`
		  CREATE TYPE popularity AS ENUM (
				'unknown',
				'known',
				'popular'
		  );
		`
		await this.sql`
		  CREATE TABLE cities (
				id SERIAL PRIMARY KEY,
				name TEXT,
				country_id INTEGER REFERENCES countries(id),
				popularity popularity
		  );
		`
	}

	public async insertSampleData(): Promise<void> {
		await this.drizzle
			.insert(countries)
			.values([{ name: `USA` }, { name: `Canada` }, { name: `Mexico` }])
		await this.drizzle.insert(cities).values([
			{ name: `New York`, countryId: 1, popularity: `popular` },
			{ name: `Los Angeles`, countryId: 1, popularity: `popular` },
			{ name: `Chicago`, countryId: 1, popularity: `known` },
			{ name: `Toronto`, countryId: 2, popularity: `known` },
			{ name: `Montreal`, countryId: 2, popularity: `known` },
			{ name: `Vancouver`, countryId: 2, popularity: `known` },
			{ name: `Mexico City`, countryId: 3, popularity: `popular` },
			{ name: `Guadalajara`, countryId: 3, popularity: `known` },
			{ name: `Monterrey`, countryId: 3, popularity: `known` },
		])
	}

	public async dropSampleTables(): Promise<void> {
		await this.sql`DROP TABLE cities`
		await this.sql`DROP TYPE popularity`
		await this.sql`DROP TABLE countries`
	}
}
