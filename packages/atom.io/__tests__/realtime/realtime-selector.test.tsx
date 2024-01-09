import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countState = AtomIO.atom({ key: `count`, default: 0 })
const countPlusTenState = AtomIO.selector({
	key: `plusTen`,
	get: ({ get }) => get(countState) + 10,
})
const countHundredfoldState = AtomIO.selector({
	key: `hundredfold`,
	get: ({ get }) => get(countState) * 100,
	set: ({ set }, value) => set(countState, value / 100),
})

describe(`pull atom, observe selector`, () => {
	const scenario = () =>
		RTTest.singleClient({
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({ socket, store })
				exposeSingle(countState)
			},
			client: () => {
				RTR.usePull(countState)
				const plusTen = AR.useO(countPlusTenState)
				const hundredfold = AR.useO(countHundredfoldState)
				return (
					<>
						<i data-testid={`plusTen:` + plusTen} />
						<i data-testid={`hundredfold:` + hundredfold} />
					</>
				)
			},
		})

	test(`receive atomic update; derive selector update`, async () => {
		const { client, server, teardown } = scenario()
		client.renderResult.getByTestId(`plusTen:10`)
		act(() => server.silo.setState(countState, 1))
		await waitFor(() => client.renderResult.getByTestId(`plusTen:11`))
		await waitFor(() => client.renderResult.getByTestId(`hundredfold:100`))
		teardown()
	})
})

describe(`pull selector, observe atom`, () => {
	const scenario = () =>
		RTTest.singleClient({
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({ socket, store })
				exposeSingle(countHundredfoldState)
			},
			client: () => {
				RTR.usePull(countHundredfoldState)
				const count = AR.useO(countState)
				const countPlusTen = AR.useO(countPlusTenState)
				return (
					<>
						<i data-testid={`count:` + count} />
						<i data-testid={`countPlusTen:` + countPlusTen} />
					</>
				)
			},
		})

	test(`receive selector update; derive atomic update`, async () => {
		const { client, server, teardown } = scenario()
		client.renderResult.getByTestId(`count:0`)
		act(() => server.silo.setState(countHundredfoldState, 2000))
		await waitFor(() => client.renderResult.getByTestId(`count:20`))
		await waitFor(() => client.renderResult.getByTestId(`countPlusTen:30`))
		teardown()
	})
})
