import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countAtom = AtomIO.atom<number>({ key: `count`, default: 0 })
const countPlusTenSelector = AtomIO.selector<number>({
	key: `countPlusTen`,
	get: ({ get }) => get(countAtom) + 10,
})
const countHundredfoldSelector = AtomIO.selector<number>({
	key: `countHundredfold`,
	get: ({ get }) => get(countAtom) * 100,
	set: ({ set }, value) => {
		set(countAtom, value / 100)
	},
})

describe(`pull atom, observe selector`, () => {
	const scenario = () =>
		RTTest.singleClient({
			server: ({ socket, userKey, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({
					socket,
					consumer: userKey,
					store,
				})
				return exposeSingle(countAtom)
			},
			client: () => {
				RTR.usePullSelector(countHundredfoldSelector)
				const plusTen = AR.useO(countPlusTenSelector)
				const hundredfold = AR.useO(countHundredfoldSelector)
				return (
					<>
						<i data-testid={`plusTen:` + plusTen} />
						<i data-testid={`hundredfold:` + hundredfold} />
					</>
				)
			},
		})

	test(`receive atomic update; derive selector update`, async () => {
		const { client: uninitializedClient, server, teardown } = scenario()
		const client = uninitializedClient.init()
		client.renderResult.getByTestId(`plusTen:10`)
		act(() => {
			server.silo.setState(countAtom, 1)
		})
		await waitFor(() => client.renderResult.getByTestId(`plusTen:11`))
		await waitFor(() => client.renderResult.getByTestId(`hundredfold:100`))
		await teardown()
	})
})

describe(`pull selector, observe atom`, () => {
	const scenario = () =>
		RTTest.singleClient({
			server: ({ socket, userKey, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({
					socket,
					store,
					consumer: userKey,
				})
				exposeSingle(countAtom)
			},
			client: () => {
				RTR.usePullSelector(countHundredfoldSelector)
				const count = AR.useO(countAtom)
				const countPlusTen = AR.useO(countPlusTenSelector)
				return (
					<>
						<i data-testid={`count:` + count} />
						<i data-testid={`countPlusTen:` + countPlusTen} />
					</>
				)
			},
		})

	test(`receive selector update; derive atomic update`, async () => {
		const { client: uninitializedClient, server, teardown } = scenario()
		const client = uninitializedClient.init()
		client.renderResult.getByTestId(`count:0`)
		act(() => {
			server.silo.setState(countHundredfoldSelector, 2000)
		})
		await waitFor(() => client.renderResult.getByTestId(`count:20`))
		await waitFor(() => client.renderResult.getByTestId(`countPlusTen:30`))
		await teardown()
	})
})
