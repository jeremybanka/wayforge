import * as crypto from "node:crypto"

import type {
	Loadable,
	ReadonlySelectorFamilyToken,
	RegularAtomFamilyToken,
} from "atom.io"
import {
	atomFamily,
	findState,
	getState,
	selectorFamily,
	setState,
} from "atom.io"
import OpenAI from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"
import type { ZodSchema } from "zod"
import { z } from "zod"

import type { Squirreled } from "../src"
import { Squirrel } from "../src"

export type Agenda = {
	[key: string]: boolean | string | null
}

export const agendaAtoms: RegularAtomFamilyToken<Agenda, string> = atomFamily<
	Agenda,
	string
>({
	key: `agendas`,
	default: {},
})
export const agendaSystemMessageSelectors: ReadonlySelectorFamilyToken<
	SystemMessage | null,
	string
> = selectorFamily<SystemMessage | null, string>({
	key: `agendaPrompts`,
	get:
		(agendaKey) =>
		({ find, get }) => {
			const agenda = get(find(agendaAtoms, agendaKey))
			const currentAgendaItems = Object.entries(agenda).filter(
				(entry): entry is [string, false | null] =>
					entry[1] === false || entry[1] === null,
			)
			if (currentAgendaItems[0] === undefined) {
				return null
			}
			let content: string
			switch (currentAgendaItems[0][1]) {
				case false:
					content = [
						`Your current agenda item is "${currentAgendaItems[0][0]}".`,
						`At the end of your message, determine whether this agenda item is complete.`,
						`If it is, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": true }`,
						`If it remains incomplete, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": false }`,
					].join(`\n\n`)
					break
				case null:
					content = [
						`This is your current agenda:`,
						JSON.stringify(agenda, null, 2),
						`Your current agenda item is a question: "${currentAgendaItems[0][0]}"`,
						`Review the conversation to determine whether this question has been answered.`,
						`If it has, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": <answer, one or two sentences> }`,
						`otherwise, end your message with the line`,
						`AGENDA_JSON{ "${currentAgendaItems[0][0]}": null }`,
					].join(`\n\n`)
					break
			}
			return {
				role: `system`,
				content,
			}
		},
})

export const orientationAtoms: RegularAtomFamilyToken<string, string> =
	atomFamily<string, string>({
		key: `orientation`,
		default: `You are an AI assistant designed to assist with tasks.`,
	})

export const messageIndices: RegularAtomFamilyToken<string[], string> =
	atomFamily<string[], string>({
		key: `messageIndices`,
		default: [],
	})

export const chatMessageAtoms: RegularAtomFamilyToken<
	Loadable<Omit<Message, `id`>>,
	string
> = atomFamily<Loadable<Omit<Message, `id`>>, string>({
	key: `messages`,
	default: {
		role: `user`,
		content: ``,
	},
})

export const conversationSelectors: ReadonlySelectorFamilyToken<
	Loadable<(AssistantMessage | SystemMessage | UserMessage)[]>,
	string
> = selectorFamily<
	Loadable<(AssistantMessage | SystemMessage | UserMessage)[]>,
	string
>({
	key: `conversationMessages`,
	get:
		(conversationKey) =>
		({ find, get }) => {
			const messageIds = get(find(messageIndices, conversationKey))
			const allMessages = Promise.all(
				messageIds.map((messageId) => get(find(chatMessageAtoms, messageId))),
			)
			return allMessages
		},
})

export const openAIParamsSelectors: ReadonlySelectorFamilyToken<
	Loadable<OpenAIResources.Chat.Completions.ChatCompletionCreateParamsNonStreaming>,
	string
> = selectorFamily<
	Loadable<OpenAIResources.Chat.Completions.ChatCompletionCreateParamsNonStreaming>,
	string
>({
	key: `openAIParams`,
	get:
		(key) =>
		async ({ find, get }) => {
			const conversationMessages = get(find(conversationSelectors, key))
			const orientation = get(find(orientationAtoms, key))
			const agendaMessage = get(find(agendaSystemMessageSelectors, key))
			const messages = await conversationMessages
			messages.push({
				role: `system`,
				content: orientation + `\n\nKeep messages short.`, // ❗
			})
			if (agendaMessage) {
				messages.push(agendaMessage)
			}

			const params = {
				model: `gpt-4-turbo`,
				stream: false,
				messages,
			} as const
			return params
		},
})

let openAiClient: OpenAI
const aiComplete = (async (
	body: OpenAIResources.ChatCompletionCreateParams,
	options?: OpenAICore.RequestOptions,
) => {
	if (!openAiClient) {
		openAiClient = new OpenAI({
			apiKey: import.meta.env.VITE_OPENAI_API_KEY,
			dangerouslyAllowBrowser: process.env[`NODE_ENV`] === `test`,
		})
	}
	return openAiClient.chat.completions.create(
		{
			...body,
			stream: false,
		},
		options,
	)
}) as typeof openAiClient.chat.completions.create
const squirrel = new Squirrel(
	process.env[`CI`]
		? `read`
		: process.env[`NODE_ENV`] === `production`
			? `off`
			: `read-write`,
)

// const completions = squirrel.add(`openai`, aiComplete)

export type AssistantMessage = {
	role: `assistant`
	content: string
}
export type UserMessage = {
	role: `user`
	content: string
}
export type SystemMessage = {
	role: `system`
	content: string
}
export type Message = AssistantMessage | UserMessage

export type AgentCompletion<Update> = {
	message: AssistantMessage
	update: Update
}

export type Agent<State = null, Update = null> = {
	conversation: Loadable<(AssistantMessage | SystemMessage | UserMessage)[]>
	state: Loadable<State>
	stream?: (handleDelta: (delta: string) => void) => { release: () => void }
	callAssistant: () => Promise<{
		message: AssistantMessage
		update: Update
	}>
	addUserMessage: (content: string) => void
}

export class Grunt<State extends Agenda>
	implements Agent<State, Partial<State>>
{
	public id: string
	public testId: string | undefined
	private completions: Squirreled<typeof aiComplete>
	public constructor(
		id: string,
		role: string,
		initialState?: State,
		initialConversation?: Message[],
		testId?: string,
	) {
		this.id = id
		this.testId = testId
		setState(findState(orientationAtoms, this.id), role)
		if (initialConversation) {
			const messageIds: string[] = []
			for (const message of initialConversation) {
				const messageId = crypto.randomUUID()
				messageIds.push(messageId)
				setState(findState(chatMessageAtoms, id), message)
			}
			setState(findState(messageIndices, id), messageIds)
		}
		if (initialState) {
			setState(findState(agendaAtoms, id), initialState)
		}
		this.completions = squirrel.add(this.testId ?? this.id, aiComplete)
	}

	public get conversation(): Loadable<
		(AssistantMessage | SystemMessage | UserMessage)[]
	> {
		const conversationLoadable = getState(
			findState(conversationSelectors, this.id),
		)
		return conversationLoadable
	}

	public get state(): State {
		const stateLoadable = getState(findState(agendaAtoms, this.id))
		return stateLoadable as State
	}

	public async callAssistant(): Promise<AgentCompletion<Partial<State>>> {
		const messageId = `${this.id}-${crypto.randomUUID()}`
		const messageAtom = findState(chatMessageAtoms, messageId)
		const messageIndex = findState(messageIndices, this.id)
		const agendaAtom = findState(agendaAtoms, this.id)
		const paramsLoadable = getState(findState(openAIParamsSelectors, this.id))
		const params = await paramsLoadable
		const assistance = this.completions
			.for(`${(await this.conversation).length.toString()}-${this.id}`)
			.get(params)
			.then((completion) => {
				const [text, stateUpdateRaw] =
					completion.choices[0].message.content?.split(`AGENDA_JSON`) ?? ``
				if (!stateUpdateRaw) {
					throw new Error(`No state update found in completion`)
				}
				const update = JSON.parse(stateUpdateRaw)
				return {
					update,
					message: {
						role: `assistant`,
						content: text,
					},
				} as const
			})
		setState(
			messageAtom,
			assistance.then(({ message }) => message),
		)
		await assistance.then(({ update }) => {
			setState(agendaAtom, (agenda) => {
				const [[k, v]] = Object.entries(update)
				const newAgenda = { ...agenda }
				newAgenda[k] = v as any
				return newAgenda
			})
		})

		setState(messageIndex, (messageIds) => [...messageIds, messageId])
		return assistance
	}

	public addUserMessage(content: string): void {
		const messageId = `${this.id}-${crypto.randomUUID()}`
		setState(findState(messageIndices, this.id), (messageIds) => [
			...messageIds,
			messageId,
		])
		const messageAtom = findState(chatMessageAtoms, messageId)
		setState(messageAtom, {
			role: `user`,
			content,
		})
	}

	public flushTestFiles(): void {
		this.completions.flush()
	}
}

export type TestTools = {
	describe: (key: string, fn: () => void) => void
	it: (key: string, fn: () => void) => void
}

export const evaluationSchema: ZodSchema<{
	passed: boolean
	message: string
}> = z.object({
	passed: z.boolean(),
	message: z.string(),
})
export type Evaluation = z.infer<typeof evaluationSchema>

export type EvaluationOptions = {
	testId: string
	exchange: (Message | SystemMessage | UserMessage)[]
	statement: string
}
export async function evaluateAgentResponse({
	testId,
	exchange,
	statement,
}: EvaluationOptions): Promise<Evaluation> {
	const messages = [
		{
			role: `system`,
			content: [
				`You are an AI assistant designed to assess other AI agents.`,
				`You will receive an EXCHANGE of messages between a human and an AI agent.`,
				`You will also receive a STATEMENT.`,
				`Please confine your response to only an Evaluation in JSON format.`,
				`\`\`\`ts\ntype Evaluation = {\n\tpassed: boolean // your determination of whether the is true,\n\tmessage: string // concise reasoning in this matter\n}\n\n`,
				`EXCHANGE:`,
				JSON.stringify(exchange, null, `\t`),
				`STATEMENT:`,
				statement,
			].join(`\n\n`),
		} as const,
	]
	const completions = squirrel.add(testId, aiComplete)
	return completions
		.for(statement)
		.get({
			model: `gpt-4-turbo`,
			messages,
		})
		.then((response) => {
			const text = response.choices[0].message.content
			if (!text) {
				throw new Error(`No text found in response`)
			}
			const json = JSON.parse(text)
			const evaluation = evaluationSchema.parse(json)
			return evaluation
		})
}
