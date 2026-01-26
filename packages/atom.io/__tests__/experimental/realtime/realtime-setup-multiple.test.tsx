import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

const countAtom = AtomIO.atom<number>({ key: `count`, default: 0 })

describe(`multi-client scenario`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, userKey, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({
					socket,
					store,
					consumer: userKey,
				})
				return exposeSingle(countAtom)
			},
			clients: {
				jim: () => {
					RTR.usePullAtom(countAtom)
					const count = AR.useO(countAtom)
					return <i data-testid={count} />
				},
				lee: () => {
					RTR.usePullAtom(countAtom)
					const count = AR.useO(countAtom)
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
		act(() => {
			server.silo.setState(countAtom, 1)
		})
		await waitFor(() => jim.renderResult.getByTestId(`1`))
		await waitFor(() => lee.renderResult.getByTestId(`1`))
		await teardown()
	})
})
