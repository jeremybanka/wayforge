/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/require-await */
import * as http from "node:http"

import type { Loadable } from "atom.io"
import * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import { parseJson } from "atom.io/json"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	vitest.spyOn(Utils, `stdout`)
})

describe(`async atom`, async () => {
	it(`hits the subscriber twice`, async () => {
		const count = AtomIO.atom<Loadable<number>>({
			key: `count`,
			default: 0,
		})
		AtomIO.subscribe(count, (update) => {
			Utils.stdout(`count`, update)
		})
		const getNumber = async () => 1
		AtomIO.setState(count, getNumber())
		const countValueInitial = AtomIO.getState(count)
		expect(countValueInitial).toBeInstanceOf(Promise)
		expect(countValueInitial).toBeInstanceOf(Internal.Future)
		const countValueAwaited = await AtomIO.getState(count)
		expect(countValueAwaited).toBe(1)
		expect(Utils.stdout).toHaveBeenCalledTimes(2)
	})
	it(`handles a rejected promise`, async () => {
		const count = AtomIO.atom<Loadable<number>>({
			key: `count`,
			default: 0,
		})
		AtomIO.subscribe(count, ({ newValue, oldValue }) => {
			Utils.stdout(`count`, { newValue, oldValue })
		})
		const getNumber = async (): Promise<number> => {
			throw new Error(`😤`)
		}
		AtomIO.setState(count, getNumber())
		const countValueInitial = AtomIO.getState(count)
		expect(countValueInitial).toBeInstanceOf(Promise)
		expect(countValueInitial).toBeInstanceOf(Internal.Future)

		expect(Utils.stdout).toHaveBeenCalledTimes(1)
	})
	it(`cancels an evicted cached pending Future`, async () => {
		const countState = AtomIO.atom<number>({
			key: `count`,
			default: 0,
		})
		let resolveAtAnInconvenientTime: () => void
		const _doubledAsyncState = AtomIO.selector<Loadable<number>>({
			key: `doubled`,
			get: ({ get }) => {
				const count = get(countState)
				return new Promise((resolve) => {
					resolveAtAnInconvenientTime = () => {
						resolve(count * 2)
					}
				})
			},
		})
		expect(Internal.IMPLICIT.STORE.valueMap.get(`doubled`)).toBeInstanceOf(
			Internal.Future,
		)
		AtomIO.setState(countState, 1)
		expect(Internal.IMPLICIT.STORE.valueMap.get(`doubled`)).toBeInstanceOf(
			Internal.Future,
		)
		// biome-ignore lint/style/noNonNullAssertion: it's a test, so
		resolveAtAnInconvenientTime!()
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(Internal.IMPLICIT.STORE.valueMap.get(`doubled`)).toBe(2)
	})
})

describe(`async selector`, () => {
	const PORT = 3443
	const ORIGIN = `http://localhost:${PORT}`
	const server = http.createServer((req, res) => {
		let data: Uint8Array[] = []
		req
			.on(`data`, (chunk) => {
				data.push(chunk)
			})
			.on(`end`, () => {
				const authHeader = req.headers.authorization
				try {
					if (authHeader !== `Bearer MY_BEARER_TOKEN`) throw 401
					if (typeof req.url !== `string`) throw 418
					const url = new URL(req.url, ORIGIN)

					switch (req.method) {
						case `POST`: {
							const body = parseJson(Buffer.concat(data).toString())
							switch (url.pathname) {
								case `/divide`:
									if (
										typeof body === `object` &&
										body !== null &&
										`dividend` in body &&
										`divisor` in body &&
										typeof body[`dividend`] === `number` &&
										typeof body[`divisor`] === `number`
									) {
										const { dividend, divisor } = body
										const quotient =
											divisor === 0
												? dividend >= 0
													? `Infinity`
													: `-Infinity`
												: dividend / divisor

										res.writeHead(200, {
											"Content-Type": `application/json`,
										})
										res.end(
											JSON.stringify({
												quotient: quotient.toString(),
											}),
										)
									} else {
										throw 400
									}
									break
								default:
									throw 404
							}
							break
						}
						case undefined:
							throw 418
						default:
							throw 405
					}
				} catch (thrown) {
					if (typeof thrown === `number`) {
						res.writeHead(thrown)
						res.end()
					} else {
						throw thrown
					}
				} finally {
					data = []
				}
			})
	})
	server.listen(PORT)
	test(`selector as a caching mechanism for async data`, async () => {
		const { atom, selector, getState /* store */ } = new AtomIO.Silo({
			name: `math`,
			lifespan: `ephemeral`,
		})
		// AtomIO.setLogLevel(`info`, store)
		const dividendState = atom<number>({
			key: `dividend`,
			default: 0,
		})
		const divisorState = atom<number>({
			key: `divisor`,
			default: 0,
		})
		const quotientState = selector<Error | Promise<Error | number> | number>({
			key: `quotient`,
			get: async ({ get }) => {
				const dividend = get(dividendState)
				const divisor = get(divisorState)
				const response = await fetch(`${ORIGIN}/divide`, {
					method: `POST`,
					headers: {
						authorization: `Bearer MY_BEARER_TOKEN`,
					},
					body: JSON.stringify({ dividend, divisor }),
				})
				const json = await response.json()
				const { quotient } = json

				if (typeof quotient === `string`) {
					const parsed = Number.parseFloat(quotient)
					if (Number.isNaN(parsed)) return Error(`quotient is NaN`)
					return parsed
				}
				return Error(`quotient is not a string`)
			},
		})
		const quotient0 = getState(quotientState)
		expect(quotient0).toBeInstanceOf(Promise)
		expect(quotient0).toBeInstanceOf(Internal.Future)

		const quotient1 = await getState(quotientState)

		expect(quotient1).toBe(Number.POSITIVE_INFINITY)

		const quotient2 = getState(quotientState)
		expect(quotient2).toBe(Number.POSITIVE_INFINITY)
	})
})
