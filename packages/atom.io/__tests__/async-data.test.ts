import * as http from "http"
import { vitest } from "vitest"

import * as AtomIO from "atom.io"
import { type Loadable, dict } from "atom.io/data"
import * as Internal from "atom.io/internal"
import * as Utils from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	vitest.spyOn(Utils, `stdout`)
})

describe(`complex async setup`, () => {
	const PROPOSAL_ID = `some-proposal-id`
	const DESIGN_ID = `some-design-id`
	type Design = {
		id: string
		counts: Record<string, number>
		letters: Record<string, string>
		statuses: Record<string, boolean>
	}
	const design: Design = {
		id: DESIGN_ID,
		counts: {
			foo: 3,
			bar: 12,
			baz: 7,
		},
		letters: {
			grault: `G`,
			waldo: `W`,
			fred: `F`,
		},
		statuses: {
			qnx: false,
			quux: false,
			corge: true,
		},
	}

	const PORT = 4935
	const ORIGIN = `http://localhost:${PORT}`
	const server = http.createServer((req, res) => {
		let data: Uint8Array[] = []
		req
			.on(`data`, (chunk) => data.push(chunk))
			.on(`end`, () => {
				if (typeof req.url !== `string`) throw 418
				const url = new URL(req.url, ORIGIN)
				switch (url.pathname) {
					case `/${PROPOSAL_ID}`:
						res.writeHead(200, { "Content-Type": `application/json` })
						res.end(JSON.stringify({ designId: DESIGN_ID }))
						break
					case `/${DESIGN_ID}`:
						res.writeHead(200, { "Content-Type": `application/json` })
						res.end(JSON.stringify({ design }))
						break
					default:
						res.writeHead(404)
						res.end()
				}
				data = []
			})
	})
	server.listen(PORT)

	test(`complex chain of async selectors`, async () => {
		const urlState = AtomIO.atom<Loadable<URL>>({
			key: `url`,
			default: () =>
				new Promise((resolve) => {
					const timeout = setTimeout(() => {
						clearTimeout(timeout)
						resolve(new URL(`${ORIGIN}/${PROPOSAL_ID}`))
					}, 10)
				}),
		})
		const proposalResultState = AtomIO.selector<Loadable<{ designId: string }>>({
			key: `proposalResult`,
			get: async ({ get }) => {
				const url = await get(urlState)
				const response = await fetch(url)
				const json = await response.json()
				return json
			},
		})
		const designResultState = AtomIO.selector<Loadable<{ design: Design }>>({
			key: `designResult`,
			get: async ({ get }) => {
				const proposalResult = await get(proposalResultState)
				const response = await fetch(
					new URL(`${ORIGIN}/${proposalResult.designId}`),
				)
				const json = await response.json()
				return json
			},
		})
		const findCountState = AtomIO.atomFamily<number, string>({
			key: `designCount`,
			default: 0,
		})
		const findLetterState = AtomIO.atomFamily<string, string>({
			key: `designLetter`,
			default: ``,
		})
		const findStatusState = AtomIO.atomFamily<boolean, string>({
			key: `designStatus`,
			default: false,
		})
		const countIndex = AtomIO.atom<string[]>({
			key: `countIndex`,
			default: [],
		})
		const letterIndex = AtomIO.atom<string[]>({
			key: `letterIndex`,
			default: [],
		})
		const statusIndex = AtomIO.atom<string[]>({
			key: `statusIndex`,
			default: [],
		})
		const countDict = dict(findCountState, countIndex)
		const letterDict = dict(findLetterState, letterIndex)
		const statusDict = dict(findStatusState, statusIndex)
		AtomIO.subscribe(designResultState, ({ newValue }) => {
			if (newValue instanceof Promise) return
			const { counts, letters, statuses } = newValue.design
			AtomIO.setState(countIndex, Object.keys(counts))
			AtomIO.setState(letterIndex, Object.keys(letters))
			AtomIO.setState(statusIndex, Object.keys(statuses))
			for (const [key, value] of Object.entries(counts)) {
				AtomIO.setState(findCountState(key), value)
			}
			for (const [key, value] of Object.entries(letters)) {
				AtomIO.setState(findLetterState(key), value)
			}
			for (const [key, value] of Object.entries(statuses)) {
				AtomIO.setState(findStatusState(key), value)
			}
		})
		const designDeltaState = AtomIO.selector<Loadable<Partial<Design>>>({
			key: `designDelta`,
			get: async ({ get }) => {
				const {
					counts: oldCounts,
					letters: oldLetters,
					statuses: oldStatuses,
				} = (await get(designResultState)).design
				const newCounts = get(countDict)
				const newLetters = get(letterDict)
				const newStatuses = get(statusDict)
				const delta: Partial<Design> = {
					id: DESIGN_ID,
				}
				if (JSON.stringify(oldCounts) !== JSON.stringify(newCounts)) {
					delta.counts = newCounts
				}
				if (JSON.stringify(oldLetters) !== JSON.stringify(newLetters)) {
					delta.letters = newLetters
				}
				if (JSON.stringify(oldStatuses) !== JSON.stringify(newStatuses)) {
					delta.statuses = newStatuses
				}
				return delta
			},
		})

		const designDelta = await AtomIO.getState(designDeltaState)
		expect(designDelta).toEqual({ id: DESIGN_ID })
		AtomIO.setState(findCountState(`foo`), 4)
		AtomIO.setState(findCountState(`bar`), 13)
		const designDelta2 = await AtomIO.getState(designDeltaState)
		expect(designDelta2).toEqual({
			id: DESIGN_ID,
			counts: {
				foo: 4,
				bar: 13,
				baz: 7,
			},
		})
	})
})
