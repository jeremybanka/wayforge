import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

AtomIO.getState(RTC.myIdState)
const countState = AtomIO.atom({ key: `count`, default: 0 })
const userActionCountServerState = AtomIO.atom<number>({
	key: `server:userActionCount`,
	default: 0,
})

const incrementTX = AtomIO.transaction({
	key: `increment`,
	do: ({ set, env }) => {
		const { name } = env().store.config
		if (name === `SERVER`) {
			set(userActionCountServerState, (c) => c + 1)
		}
		set(countState, (c) => c + 1)
	},
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				const syncTX = RTS.realtimeActionSynchronizer({ socket, store })
				syncTX(incrementTX, (updates) =>
					updates.filter((u) => {
						if (u.key === `count`) {
							return true
						}
					}),
				)
			},
			clients: {
				dave: () => {
					const increment = RTR.useSyncAction(incrementTX)
					return (
						<button
							type="button"
							onClick={() => increment()}
							data-testid={`increment`}
						/>
					)
				},
				jane: () => {
					const increment = RTR.useSyncAction(incrementTX)
					const count = AR.useO(countState)
					return <i data-testid={count} />
				},
			},
		})

	test(`client 1 -> server -> client 2`, async () => {
		const {
			clients: { jane, dave },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)
		act(() => dave.renderResult.getByTestId(`increment`).click())
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})
})
