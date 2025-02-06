import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"
import type { ChatCompletionChunk } from "openai/resources/index"

import { Ferret } from "../src"

test(`ferret`, async () => {
	const myStreamFunction = () => {
		const myAsyncIterable = {
			async *[Symbol.asyncIterator]() {
				await new Promise((resolve) => setTimeout(resolve, 100))
				yield `chunk1`
				await new Promise((resolve) => setTimeout(resolve, 100))
				yield `chunk2`
				await new Promise((resolve) => setTimeout(resolve, 100))
				yield `chunk3`
			},
		}
		return Promise.resolve(myAsyncIterable)
	}
	const myFerret = new Ferret(`read-write`)

	const iterable = await myFerret
		.add(`myStreamer`, myStreamFunction)
		.for(`myAsyncIterable`)
		.get()

	const chunksExpected = [`chunk1`, `chunk2`, `chunk3`]
	for await (const chunk of iterable) {
		console.log(chunk)
		expect(chunk).toBe(chunksExpected.shift())
	}
})

test(`ferret with openAI`, async () => {
	let openAI: OpenAI | undefined
	function getStreamFromOpenAi(
		body: Omit<OpenAIResources.ChatCompletionCreateParamsStreaming, `stream`>,
		options?: OpenAICore.RequestOptions,
	): Promise<AsyncIterable<ChatCompletionChunk>> {
		if (!openAI) {
			openAI = new OpenAI({
				apiKey: import.meta.env.VITE_OPENAI_API_KEY,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
		}

		const createParams: OpenAIResources.ChatCompletionCreateParamsStreaming = {
			...body,
			stream: true,
		}
		const stream = openAI.chat.completions.create(createParams, options)
		return stream
	}

	const myFerret = new Ferret(`read-write`)

	const aiResponse = myFerret
		.add(`myAiService`, getStreamFromOpenAi)
		.for(`sampleRequest`)
		.get({
			model: `gpt-4-turbo`,
			messages: [{ role: `user`, content: `Hello, how are you?` }],
		})

	const chunks: ChatCompletionChunk[] = []
	for await (const chunk of await aiResponse) {
		chunks.push(chunk)
	}
	expect(chunks.length).toBe(33)
})

test(`ferret with openAI (cache-miss)`, async () => {
	let openAI: OpenAI | undefined
	function getStreamFromOpenAi(
		body: Omit<OpenAIResources.ChatCompletionCreateParamsStreaming, `stream`>,
		options?: OpenAICore.RequestOptions,
	): Promise<AsyncIterable<ChatCompletionChunk>> {
		if (!openAI) {
			openAI = new OpenAI({
				apiKey: import.meta.env.VITE_OPENAI_API_KEY,
				dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
			})
		}

		const createParams: OpenAIResources.ChatCompletionCreateParamsStreaming = {
			...body,
			stream: true,
		}
		console.log(`createParams`, createParams)
		const stream = openAI.chat.completions.create(createParams, options)
		return stream
	}

	const myFerret = new Ferret(`read`)

	let caught: Error | undefined
	try {
		await myFerret
			.add(`myAiService`, getStreamFromOpenAi)
			.for(`miss`)
			.get({
				model: `gpt-4-turbo`,
				messages: [
					{ role: `user`, content: `Hello!!!!!!!!!!!!!!!!!!!!!!!!!!!!!` },
				],
			})
	} catch (thrown) {
		if (thrown instanceof Error) {
			caught = thrown
		}
	} finally {
		expect(caught).toBeInstanceOf(Error)
		expect(caught?.message).toContain(`Hello, how are you?`)
		expect(caught?.message).toContain(`Hello!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
		expect(caught?.message).toContain(`YOUR INPUT DATA:`)
		expect(caught?.message).toContain(`CACHED INPUT FILES:`)
	}
})
