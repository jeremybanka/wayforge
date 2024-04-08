import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countState = AtomIO.atom({ key: `count`, default: 0 })

describe(`single-client scenario`, () => {
	const scenario = () => {
		const { server, client, teardown } = RTTest.singleClient({
			port: 6865,
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({ socket, store })
				exposeSingle(countState)
			},
			client: () => {
				RTR.usePullAtom(countState)
				const count = AR.useO(countState)
				return <i data-testid={count} />
			},
		})

		return { client, server, teardown }
	}

	it(`responds to changes on the server`, async () => {
		const { client, server, teardown } = scenario()
		const app = client.init()
		app.renderResult.getByTestId(`0`)
		act(() => { server.silo.setState(countState, 1); })
		await waitFor(() => app.renderResult.getByTestId(`1`))
		teardown()
	})
})
