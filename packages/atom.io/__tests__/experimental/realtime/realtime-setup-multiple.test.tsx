import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countState = AtomIO.atom({ key: `count`, default: 0 })

describe(`multi-client scenario`, () => {
	const scenario = () =>
		RTTest.multiClient({
			port: 8325,
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({ socket, store })
				exposeSingle(countState)
			},
			clients: {
				jim: () => {
					RTR.usePullAtom(countState)
					const count = AR.useO(countState)
					return <i data-testid={count} />
				},
				lee: () => {
					RTR.usePullAtom(countState)
					const count = AR.useO(countState)
					return <i data-testid={count} />
				},
			},
		})

	test(`both clients respond to changes on the server`, async () => {
		const { clients, server, teardown } = scenario()

		const jim = clients.jim.init()
		const lee = clients.lee.init()

		jim.renderResult.getByTestId(`0`)
		lee.renderResult.getByTestId(`0`)
		act(() => server.silo.setState(countState, 1))
		await waitFor(() => jim.renderResult.getByTestId(`1`))
		await waitFor(() => lee.renderResult.getByTestId(`1`))
		teardown()
	})
})
