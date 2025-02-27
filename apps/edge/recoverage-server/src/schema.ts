import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// Users table: Stores user information with GitHub ID as the primary key
export const users = sqliteTable("users", {
	id: integer("id").primaryKey(), // GitHub user ID (integer, as GitHub IDs are numeric)
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
})

// Tokens table: Stores API tokens for authentication
export const tokens = sqliteTable("tokens", {
	selector: text("selector").primaryKey(), // Unique identifier for the token (part of the token string)
	userId: integer("user_id").references(() => users.id), // Foreign key to users
	verifierHash: text("verifier_hash"), // Hashed portion of the token for security
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
})

// Reports table: Stores coverage reports
export const reports = sqliteTable("reports", {
	id: text("id").primaryKey(), // Unique string ID (e.g., UUID)
	userId: integer("user_id").references(() => users.id), // Foreign key to users
	isDefault: integer("is_default", { mode: "boolean" }).default(false), // Indicates the default report
	data: text("data"), // JSON data stored as text
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
})
