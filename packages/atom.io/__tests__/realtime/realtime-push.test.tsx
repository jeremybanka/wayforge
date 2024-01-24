import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countState = AtomIO.atom({ key: `count`, default: 0 })

describe(`pushing state`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				const provideState = RTS.realtimeStateProvider({ socket, store })
				const receiveState = RTS.realtimeStateReceiver({ socket, store })
				provideState(countState)
				receiveState(countState)
			},
			clients: {
				dave: () => {
					RTR.usePush(countState)
					const setCount = AR.useI(countState)
					return (
						<button
							type="button"
							onClick={() => setCount((c) => c + 1)}
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
		act(() => dave.renderResult.getByTestId(`increment`).click())
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})
})
