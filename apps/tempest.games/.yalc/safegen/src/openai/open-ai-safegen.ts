import type { ChatModel } from "openai/resources/index"

import { createSafeDataGenerator } from "../safegen"
import { buildOpenAiRequestParams } from "./build-open-ai-request-params"
import { setUpOpenAiJsonGenerator } from "./set-up-open-ai-generator"

let getUnknownJsonFromOpenAi: ReturnType<typeof setUpOpenAiJsonGenerator>
export const openaiSafeGen = (model: ChatModel, apiKey: string) =>
	createSafeDataGenerator((...params) => {
		if (!getUnknownJsonFromOpenAi) {
			getUnknownJsonFromOpenAi = setUpOpenAiJsonGenerator(apiKey)
		}
		const openAiParams = buildOpenAiRequestParams(model, ...params)
		return getUnknownJsonFromOpenAi(openAiParams)
	})
