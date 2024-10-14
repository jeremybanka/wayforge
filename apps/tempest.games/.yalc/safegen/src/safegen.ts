import type { Json } from "atom.io/json"
import type { ZodError, ZodSchema } from "zod"
import type { JsonSchema7Type } from "zod-to-json-schema"
import zodToJsonSchema from "zod-to-json-schema"

export type InvalidResponse = {
	response: Json.Object
	error: ZodError
}

export type GenerateJsonFromLLM = (
	instruction: string,
	jsonSchema: JsonSchema7Type,
	example: Json.Object,
	previouslyFailedResponses: InvalidResponse[],
) => Promise<Json.Object>

export type GenerateSafeData<T> = (
	userInstruction: string,
	maxAttempts?: number,
) => Promise<T>

export type DataSpec<T> = {
	schema: ZodSchema<T>
	fallback: T
}

export type GenerateFromSchema = <J extends Json.Object>(
	dataSpec: DataSpec<J>,
) => GenerateSafeData<J>

export function createSafeDataGenerator(
	gen: GenerateJsonFromLLM,
	logger?: Pick<Console, `error` | `info` | `warn`>,
): GenerateFromSchema {
	return function generateFromSchema<J extends Json.Object>({
		schema,
		fallback,
	}: DataSpec<J>): GenerateSafeData<J> {
		const jsonSchema = zodToJsonSchema(schema)
		return async function generateSafeData(
			userInstruction: string,
			maxAttempts = 3,
		) {
			let currentResponse: Json.Object
			const invalidResponses: InvalidResponse[] = []
			while (invalidResponses.length < maxAttempts) {
				currentResponse = await gen(
					userInstruction,
					jsonSchema,
					fallback,
					invalidResponses,
				)
				const result = schema.safeParse(currentResponse)
				if (result.success) {
					return result.data
				}
				logger?.warn(
					`safegen failed to generate well-formed data.\n`,
					`Here's what was returned last time:\n`,
					JSON.stringify(currentResponse, null, `\t`),
					`\n`,
					`Here's the error message from zod:\n`,
					result.error.toString(),
				)
				invalidResponses.push({
					response: currentResponse,
					error: result.error,
				})
			}
			logger?.error(
				`safegen was unable to generate well-formed data after ${maxAttempts} failed attempts.`,
			)
			return fallback
		}
	}
}

export function jsonSchemaToInstruction(jsonSchema: JsonSchema7Type) {
	return [
		`Please generate a response in JSON that conforms to the following JSON Schema:`,
		JSON.stringify(jsonSchema, null, 2),
	].join(`\n`)
}
