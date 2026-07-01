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

export type OptionsSchema<Options> = StandardSchemaV1<unknown, Options> &
	StandardJSONSchemaV1<unknown, Options>

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
	optionsSchema: OptionsSchema<any>,
): JsonSchema {
	return disallowAdditionalProperties(
		optionsSchema[`~standard`].jsonSchema.input(jsonSchemaOptions),
	)
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
