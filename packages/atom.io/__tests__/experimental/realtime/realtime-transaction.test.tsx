import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countState = AtomIO.atom({ key: `count`, default: 0 })
const incrementTX = AtomIO.transaction({
	key: `increment`,
	do: ({ set }) => {
		set(countState, (c) => c + 1)
	},
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			port: 2925,
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({ socket, store })
				const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
				exposeSingle(countState)
				receiveTransaction(incrementTX)
			},
			clients: {
				dave: () => {
					const increment = RTR.useServerAction(incrementTX)
					return (
						<button
							type="button"
							onClick={() => increment()}
							data-testid={`increment`}
						/>
					)
				},
				jane: () => {
					RTR.usePullAtom(countState)
					const count = AR.useO(countState)
					return <i data-testid={count} />
				},
			},
		})

	test(`client 1 -> server -> client 2`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		jane.renderResult.getByTestId(`0`)
		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})

	test(`client 2 disconnects/reconnects, gets update`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		jane.renderResult.getByTestId(`0`)
		jane.socket.disconnect()

		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})

		jane.renderResult.getByTestId(`0`)
		jane.socket.connect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))

		teardown()
	})

	test(`client 1 disconnects, makes update, reconnects`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		jane.renderResult.getByTestId(`0`)
		dave.socket.disconnect()
		act(() => {
			dave.renderResult.getByTestId(`increment`).click()
		})

		jane.renderResult.getByTestId(`0`)
		dave.socket.connect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))

		teardown()
	})
})
