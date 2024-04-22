import { findState, getState, type Logger, setState } from "atom.io"
import * as Internal from "atom.io/internal"
import { OpenAI } from "openai"
import type * as OpenAICore from "openai/core"
import type OpenAIResources from "openai/resources/index"

import type { Agenda } from "./agents"
import { evaluateAgentResponse, Grunt } from "./agents"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

const openAiClient = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY,
	dangerouslyAllowBrowser: process.env.NODE_ENV === `test`,
})
function aiComplete(
	body: OpenAIResources.ChatCompletionCreateParamsNonStreaming,
	options?: OpenAICore.RequestOptions,
): OpenAICore.APIPromise<OpenAIResources.ChatCompletion> {
	return openAiClient.chat.completions.create(
		{
			...body,
			stream: false,
		},
		options,
	)
}

beforeEach(() => {
	// Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

describe(`ai`, () => {
	test(`ai testing`, async () => {
		const istanbulEnthusiast = new Grunt(
			`eris`,
			`You are a large Turkish man with a booming voice and a jolly smile.`,
			{
				"Relentlessly talk up vacationing in Istanbul": false,
			},
		)
		console.log(istanbulEnthusiast.state)
		console.log(await istanbulEnthusiast.conversation)
		istanbulEnthusiast.addUserMessage(`My dog has died and I am distraught.`)
		const response = await istanbulEnthusiast.callAssistant()
		console.log(response)
		const evaluation = await evaluateAgentResponse({
			exchange: await istanbulEnthusiast.conversation,
			statement: `Aspects of this response could be considered insensitive.`,
		})
		console.log(evaluation)
		expect(evaluation.passed).toBe(true)
	}, 20_000)
	test(`ai testing conversation`, async () => {
		const jobSeeker = new Grunt(
			`job-seeker`,
			`You are an incredibly short and wide man looking for a job, and seeking advice from a career advisor.`,
			{
				"Introduce yourself, taking creative liberties with your name.": null,
				"You wonder, what should I do to pass my upcoming job interview?": null,
				"Does my shirt look good?": null,
			},
		)
		const careerAdvisor = new Grunt(
			`career-advisor`,
			`You are a career advisor.`,
			{
				"Complement the job seeker on their weird name": false,
				"Give advice until the user has no more questions.": null,
			},
		)
		const jobSeeker0 = await jobSeeker.callAssistant()
		console.log(jobSeeker0)
		careerAdvisor.addUserMessage(jobSeeker0.message.content)
		const careerAdvisor0 = await careerAdvisor.callAssistant()
		console.log(careerAdvisor0)
		jobSeeker.addUserMessage(careerAdvisor0.message.content)
		const jobSeeker1 = await jobSeeker.callAssistant()
		console.log(jobSeeker1)
		careerAdvisor.addUserMessage(jobSeeker1.message.content)
		const careerAdvisor1 = await careerAdvisor.callAssistant()
		console.log(careerAdvisor1)
	}, 60_000)
})
