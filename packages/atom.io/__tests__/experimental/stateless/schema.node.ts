import type { PgColumn, PgEnum, PgTableWithColumns } from "drizzle-orm/pg-core"
import {
	integer,
	pgEnum,
	pgTable,
	serial,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core"

export const popularityEnum: PgEnum<[`unknown`, `known`, `popular`]> = pgEnum(
	`popularity`,
	[`unknown`, `known`, `popular`],
)

export const countries: PgTableWithColumns<{
	name: `countries`
	schema: undefined
	columns: {
		id: PgColumn<
			{
				name: `id`
				tableName: `countries`
				dataType: `number`
				columnType: `PgSerial`
				data: number
				driverParam: number
				notNull: true
				hasDefault: true
				isPrimaryKey: true
				isAutoincrement: false
				hasRuntimeDefault: false
				enumValues: undefined
				generated: undefined
			},
			{},
			{}
		>
		name: PgColumn<
			{
				name: `name`
				tableName: `countries`
				dataType: `string`
				columnType: `PgVarchar`
				data: string
				driverParam: string
				notNull: false
				hasDefault: false
				isPrimaryKey: false
				isAutoincrement: false
				hasRuntimeDefault: false
				enumValues: string[]
				generated: undefined
			},
			{},
			{}
		>
	}
	dialect: `pg`
}> = pgTable(
	`countries`,
	{
		id: serial(`id`).primaryKey(),
		name: varchar(`name`, { length: 256 }),
	},
	(col) => [uniqueIndex(`name_idx`).on(col.name)],
)

export const cities: PgTableWithColumns<{
	name: `cities`
	schema: undefined
	columns: {
		id: PgColumn<
			{
				name: `id`
				tableName: `cities`
				dataType: `number`
				columnType: `PgSerial`
				data: number
				driverParam: number
				notNull: true
				hasDefault: true
				isPrimaryKey: true
				isAutoincrement: false
				hasRuntimeDefault: false
				enumValues: undefined
				generated: undefined
			},
			{},
			{}
		>
		name: PgColumn<
			{
				name: `name`
				tableName: `cities`
				dataType: `string`
				columnType: `PgVarchar`
				data: string
				driverParam: string
				notNull: false
				hasDefault: false
				isPrimaryKey: false
				isAutoincrement: false
				hasRuntimeDefault: false
				enumValues: string[]
				generated: undefined
			},
			{},
			{}
		>
		countryId: PgColumn<
			{
				name: `country_id`
				tableName: `cities`
				dataType: `number`
				columnType: `PgInteger`
				data: number
				driverParam: number | string
				notNull: false
				hasDefault: false
				isPrimaryKey: false
				isAutoincrement: false
				hasRuntimeDefault: false
				enumValues: undefined
				generated: undefined
			},
			{},
			{}
		>
		popularity: PgColumn<
			{
				name: `popularity`
				tableName: `cities`
				dataType: `string`
				columnType: `PgEnumColumn`
				data: `known` | `popular` | `unknown`
				driverParam: string
				notNull: false
				hasDefault: false
				isPrimaryKey: false
				isAutoincrement: false
				hasRuntimeDefault: false
				enumValues: string[]
				generated: undefined
			},
			{},
			{}
		>
	}
	dialect: `pg`
}> = pgTable(`cities`, {
	id: serial(`id`).primaryKey(),
	name: varchar(`name`, { length: 256 }),
	countryId: integer(`country_id`).references(() => countries.id),
	popularity: popularityEnum(`popularity`),
})
