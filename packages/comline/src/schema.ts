import type {
	StandardJSONSchemaV1,
	StandardSchemaV1,
} from "@standard-schema/spec"

export type JsonSchema = Record<string, unknown> & {
	$schema?: string
	additionalProperties?: boolean | JsonSchema
	allOf?: readonly JsonSchema[]
	anyOf?: readonly JsonSchema[]
	const?: unknown
	enum?: readonly unknown[]
	oneOf?: readonly JsonSchema[]
	properties?: Record<string, JsonSchema>
	required?: readonly string[]
	type?: string | readonly string[]
}

export type OptionsSchema<Options, Input = unknown> = StandardSchemaV1<
	Input,
	Options
> & {
	readonly [`~standard`]: {
		readonly jsonSchema?: StandardJSONSchemaV1.Converter
	}
}

const jsonSchemaOptions: StandardJSONSchemaV1.Options = {
	target: `draft-2020-12`,
}

const emptyObjectJsonSchema = {
	$schema: `https://json-schema.org/draft/2020-12/schema`,
	additionalProperties: false,
	type: `object`,
	properties: {},
} satisfies JsonSchema

export const emptySchema: OptionsSchema<Record<never, never>> = {
	"~standard": {
		version: 1,
		vendor: `comline`,
		validate: (): StandardSchemaV1.Result<Record<never, never>> => ({
			value: {},
		}),
		jsonSchema: {
			input: (): JsonSchema => emptyObjectJsonSchema,
			output: (): JsonSchema => emptyObjectJsonSchema,
		},
	},
}

function isObjectJsonSchema(jsonSchema: JsonSchema): boolean {
	const { type } = jsonSchema
	return type === `object` || (Array.isArray(type) && type.includes(`object`))
}

function disallowAdditionalProperties(jsonSchema: JsonSchema): JsonSchema {
	if (!isObjectJsonSchema(jsonSchema) || `additionalProperties` in jsonSchema) {
		return jsonSchema
	}
	const { $schema, ...rest } = jsonSchema
	return {
		...($schema === undefined ? {} : { $schema }),
		additionalProperties: false,
		...rest,
	}
}

export function retrieveInputJsonSchema(
	optionsSchema: {
		readonly [`~standard`]: {
			readonly vendor: string
			readonly jsonSchema?: StandardJSONSchemaV1.Converter
		}
	},
	strict = false,
): JsonSchema {
	const converter = optionsSchema[`~standard`].jsonSchema
	if (!converter) {
		throw new Error(`This schema does not support JSON Schema export.`)
	}
	// Arktype's Standard JSON Schema adapter otherwise silently replaces
	// unrepresentable values with {}. Explicit export must retain its failures.
	const conversionOptions =
		strict && optionsSchema[`~standard`].vendor === `arktype`
			? {
					...jsonSchemaOptions,
					libraryOptions: {
						fallback: () => {
							throw new Error(
								`The runtime schema contains values or constraints that JSON Schema cannot represent.`,
							)
						},
					},
				}
			: jsonSchemaOptions
	return disallowAdditionalProperties(converter.input(conversionOptions))
}

/** Presentation metadata is optional; unsupported conversion must not block parsing. */
export function tryRetrieveInputJsonSchema(
	schema: Parameters<typeof retrieveInputJsonSchema>[0] | undefined,
): JsonSchema | undefined {
	if (!schema) return undefined
	try {
		return retrieveInputJsonSchema(schema)
	} catch {
		return undefined
	}
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
	return (
		typeof value === `object` &&
		value !== null &&
		`then` in value &&
		typeof value.then === `function`
	)
}

function stringifyIssuePath(
	path: StandardSchemaV1.Issue[`path`],
): string | undefined {
	return path
		?.map((segment) => (typeof segment === `object` ? segment.key : segment))
		.map(String)
		.join(`.`)
}

function formatSchemaValidationIssues(
	issues: ReadonlyArray<StandardSchemaV1.Issue>,
): string {
	if (issues.length === 0) {
		return `Options failed validation.`
	}
	return (
		`Options failed validation:` +
		issues
			.map((issue) => {
				const path = stringifyIssuePath(issue.path)
				return `\n\t- ${path ? `${path}: ` : ``}${issue.message}`
			})
			.join(``)
	)
}

export function validateOptionsSchema<Options>(
	optionsSchema: OptionsSchema<Options>,
	value: unknown,
): Options {
	const result = optionsSchema[`~standard`].validate(value)
	if (isPromiseLike(result)) {
		throw new Error(`comline does not support async Standard Schema validation.`)
	}
	if (result.issues) {
		throw new Error(formatSchemaValidationIssues(result.issues))
	}
	return result.value
}
