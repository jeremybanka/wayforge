import { createOpenAI } from "@ai-sdk/openai"
import { generateText, type LanguageModel, type ModelMessage, Output } from "ai"
import type { distill, Type } from "arktype"
import { type } from "arktype"
import { Squirrel } from "varmint"

import { env } from "../../library/env"

export const IN_VITEST = `vitest` in globalThis

const CACHE_MODE = IN_VITEST ? `read-write` : `off`
export const squirrel = new Squirrel(CACHE_MODE, `__tests__/.varmint`)

export type GenerateOptions = {
	messages: ModelMessage[]
	model: LanguageModel
}

type Generated<T> = distill.Out<T> extends infer Output ? Output : never

const openai = createOpenAI({
	apiKey: env.API_KEY_OPENAI ?? ``,
})
export const gpt5point2 = openai(`gpt-5.2`)

export type NutritionFacts = {
	carbs: number
	protein: number
}

export function createGenerator<T>(
	schema: Type<T>,
	model: LanguageModel,
): ({ messages, model }: GenerateOptions) => Promise<Generated<T>> {
	return async ({ messages }: GenerateOptions): Promise<Generated<T>> => {
		const { output } = await generateText({
			model,
			output: Output.object({ schema }),
			messages,
		})
		return output
	}
}

export function createSquirreledGenerator<T>(
	schema: Type<T>,
	model: LanguageModel,
): ({ messages, model }: GenerateOptions) => Promise<Generated<T>> {
	const generate = async ({
		messages,
	}: GenerateOptions): Promise<Generated<T>> => {
		const { output } = await generateText({
			model,
			output: Output.object({ schema }),
			messages,
		})
		return output
	}
	const modelName = typeof model === `string` ? model : model.modelId
	const generateSquirreled = squirrel.add(modelName, generate)
	return async (options) => {
		const output = await generateSquirreled
			.for(JSON.stringify(options.messages))
			.get(options)
		return output
	}
}

export const nutritionFactsSchema = type({
	carbs: `number`,
	protein: `number`,
})

const generateNutritionFacts = createSquirreledGenerator<NutritionFacts>(
	nutritionFactsSchema,
	gpt5point2,
)

export async function nutritionFactsGenerator(
	prompt: string,
): Promise<NutritionFacts> {
	return generateNutritionFacts({
		model: gpt5point2,
		messages: [{ role: `user`, content: prompt }],
	})
}
