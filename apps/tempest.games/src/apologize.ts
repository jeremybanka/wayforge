import { RESPONSE_DICTIONARY } from "./response-dictionary"

export function apologize(thrown: unknown): Response {
	if (typeof thrown === `number`) {
		return new Response(null, {
			status: thrown,
			statusText:
				RESPONSE_DICTIONARY[thrown as keyof typeof RESPONSE_DICTIONARY],
		})
	}
	if (thrown instanceof Error) {
		console.error(thrown)
		return new Response(thrown.stack, { status: 500 })
	}

	const errorCode = 418
	return new Response(RESPONSE_DICTIONARY[errorCode], { status: errorCode })
}
