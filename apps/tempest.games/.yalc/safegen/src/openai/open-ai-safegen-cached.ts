import type { ChatModel } from "openai/resources/index.mjs"
import { Squirrel } from "varmint"

import type { GenerateFromSchema } from "../safegen"
import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-open-ai-request-params"
import { setUpOpenAiJsonGenerator } from "./set-up-open-ai-generator"

/* eslint-disable @typescript-eslint/no-explicit-any */
// biome-ignore lint/suspicious/noExplicitAny: here it's really the type of a function
export type AsyncFn = (...params: any[]) => Promise<any>
/* eslint-enable @typescript-eslint/no-explicit-any */

let squirrel: Squirrel
export type Squirreled<Fn extends AsyncFn> = ReturnType<typeof squirrel.add<Fn>>

export class OpenAiSafeGenerator {
	public squirrel: Squirrel
	public getUnknownJsonFromOpenAi: ReturnType<typeof setUpOpenAiJsonGenerator>
	public getUnknownJsonFromOpenAiCached: Squirreled<
		ReturnType<typeof setUpOpenAiJsonGenerator>
	>

	public constructor(model: ChatModel, apiKey: string) {
		this.squirrel = new Squirrel(
			process.env.CI
				? `read`
				: process.env.NODE_ENV === `production`
					? `off`
					: `read-write`,
		)
		this.getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(apiKey)
		this.getUnknownJsonFromOpenAiCached = this.squirrel.add(
			`openai-safegen`,
			this.getUnknownJsonFromOpenAi,
		)
		this.from = createSafeDataGenerator(async (...params) => {
			const openAiParams = buildOpenAiRequestParams(model, ...params)
			const instruction = params[0]
			const previouslyFailedResponses = params[3]
			const response = await this.getUnknownJsonFromOpenAiCached
				.for(
					`${instruction.replace(/[^a-zA-Z0-9-_. ]/g, `_`)}-${previouslyFailedResponses.length}`,
				)
				.get(openAiParams)
			return response
		})
	}

	public from: GenerateFromSchema
}
