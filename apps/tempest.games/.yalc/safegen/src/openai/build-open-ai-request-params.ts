import type {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionMessageParam,
	ChatModel,
} from "openai/resources/index"

import type { GenerateJsonFromLLM } from "../safegen"
import { jsonSchemaToInstruction } from "../safegen"

export function buildOpenAiRequestParams(
	model: ChatModel,
	...params: Parameters<GenerateJsonFromLLM>
): ChatCompletionCreateParamsNonStreaming {
	const [instruction, jsonSchema, _, previouslyFailedResponses] = params
	const messages: ChatCompletionMessageParam[] = [
		{
			role: `user`,
			content: instruction,
		},
		{
			role: `user`,
			content: jsonSchemaToInstruction(jsonSchema),
		},
	]
	const lastFailedResponse = previouslyFailedResponses.at(-1)
	if (lastFailedResponse) {
		messages.push({
			role: `user`,
			content: [
				`Oops! That didn't work. Here's what was returned last time:`,
				JSON.stringify(lastFailedResponse.response, null, 2),
				`Here's the error message:`,
				lastFailedResponse.error.toString(),
			].join(`\n`),
		})
	}
	return { model, messages }
}
