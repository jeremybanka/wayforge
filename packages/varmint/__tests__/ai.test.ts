import type { Logger } from "atom.io"
import * as Internal from "atom.io/internal"

import type { Agent, AgentCompletion } from "./agents"
import { evaluateAgentResponse, Grunt } from "./agents"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger
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
				"Give advice until the user has no more questions.": false,
			},
		)
		function openDialogue<Update0, Update1>(
			agent0: Agent<any, Update0>,
			agent1: Agent<any, Update1>,
			options?: { log?: boolean },
		): [
			callAgent0: () => Promise<AgentCompletion<Update0>>,
			callAgent1: () => Promise<AgentCompletion<Update1>>,
		] {
			const callAgent0 = async () => {
				const agent0Completion = await agent0.callAssistant()
				if (options?.log) {
					console.log(agent0Completion)
				}
				agent1.addUserMessage(agent0Completion.message.content)
				return agent0Completion
			}
			const callAgent1 = async () => {
				const agent1Completion = await agent1.callAssistant()
				if (options?.log) {
					console.log(agent1Completion)
				}
				agent0.addUserMessage(agent1Completion.message.content)
				return agent1Completion
			}
			return [callAgent0, callAgent1] as const
		}
		const [callJobSeeker, callCareerAdvisor] = openDialogue(
			jobSeeker,
			careerAdvisor,
			{ log: true },
		)
		await callJobSeeker()
		await callCareerAdvisor()
		await callJobSeeker()
		await callCareerAdvisor()
		await callJobSeeker()
		await callCareerAdvisor()
		const evaluation = await evaluateAgentResponse({
			exchange: await careerAdvisor.conversation,
			statement: `The assistant acted cordially and provided helpful advice.`,
		})
		console.log(evaluation)
		expect(evaluation.passed).toBe(true)
	}, 120_000)
})
