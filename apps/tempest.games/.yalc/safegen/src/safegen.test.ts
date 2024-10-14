import { describe, expect, test } from "vitest"
import { z } from "zod"

import { OpenAiSafeGenerator } from "./openai"

describe(`safeGen`, () => {
	test(`safeGen should answer request in the form of data`, async () => {
		const gpt4o = new OpenAiSafeGenerator(
			`gpt-4o`,
			import.meta.env.VITE_OPENAI_API_KEY,
		)

		const countSpec = {
			schema: z.object({ count: z.number() }),
			fallback: { count: 0 },
		}

		const counter = gpt4o.from(countSpec)

		const { count: numberOfPlanetsInTheSolarSystem } = await counter(
			`How many planets are in the solar system?`,
		)
		expect(numberOfPlanetsInTheSolarSystem).toBe(8)
	})
})
