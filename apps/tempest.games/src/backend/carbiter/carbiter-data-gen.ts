import { type } from "arktype"
import { arktypeToJsonSchema } from "safegen/arktype"
import { OpenAiSafeGenerator } from "safegen/openai"

import { env } from "../../library/env"

export const safeGen = new OpenAiSafeGenerator({
	apiKey: env.API_KEY_OPENAI ?? ``,
	model: `gpt-5.2`,
	cachingMode: `read-write`,
	usdBudget: 0,
	usdMinimum: Number.NEGATIVE_INFINITY,
})

export const nutritionFactsType = type({
	carbs: `number`,
	protein: `number`,
})

export const nutritionFactsGenerator = safeGen.object({
	toJsonSchema: arktypeToJsonSchema,
	schema: nutritionFactsType,
	fallback: { carbs: 0, protein: 0 },
})
