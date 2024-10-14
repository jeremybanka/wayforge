import { createHash } from "node:crypto"

import type { Json } from "atom.io/json"
import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"

export const clientCache = new Map<string, OpenAI>()

export type GetUnknownJsonFromOpenAi = (
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAICore.RequestOptions,
) => Promise<Json.Object>

export function setUpOpenAiJsonGenerator(
	apiKey = `NO_API_KEY_PROVIDED`,
): GetUnknownJsonFromOpenAi {
	const keyHash = createHash(`sha256`).update(apiKey).digest(`hex`)
	return async function getUnknownJsonFromOpenAi(body, options) {
		let client = clientCache.get(keyHash)
		if (!client) {
			client = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
			clientCache.set(keyHash, client)
		}
		const completion = await client.chat.completions.create(
			{
				...body,
				stream: false,
				response_format: { type: `json_object` },
			},
			options,
		)
		const content = completion.choices[0].message?.content
		if (content) {
			return JSON.parse(content)
		}
		throw new Error(`No message found in completion`)
	}
}
