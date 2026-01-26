import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"

console.log = () => undefined
console.info = () => undefined
console.warn = () => undefined
console.error = () => undefined
let LOGGING: boolean
beforeEach(() => (LOGGING = true))

type CollectionName = `bar` | `foo`

const numberCollectionAtoms = AtomIO.atomFamily<number[], string>({
	key: `numberCollection`,
	default: [0],
})
const exposedCollectionAtom = AtomIO.atom<Set<string>>({
	key: `exposedCollection`,
	default: new Set([`foo`]),
})
const focusedCollectionNameAtom = AtomIO.atom<CollectionName>({
	key: `focusedCollectionName`,
	default: `foo`,
})

function RealtimeDisplay(): React.ReactNode {
	const name = AR.useO(focusedCollectionNameAtom)
	RTR.usePullAtomFamilyMember(numberCollectionAtoms, name)
	const numbers = AR.useO(numberCollectionAtoms, name)
	return (
		<ul data-testid={name}>
			{numbers.map((n) => (
				<li data-testid={n} key={n} />
			))}
		</ul>
	)
}

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, userKey, silo: { store }, enableLogging }) => {
				if (LOGGING) {
					enableLogging()
				}
				const exposeFamily = RTS.realtimeAtomFamilyProvider({
					socket,
					consumer: userKey,
					store,
				})
				return exposeFamily(numberCollectionAtoms, exposedCollectionAtom)
			},
			clients: {
				jane: () => {
					const [isShowingRealtimeDisplay, setShowingRealtimeDisplay] =
						React.useState(false)
					return (
						<>
							<button
								type="button"
								onClick={() => {
									setShowingRealtimeDisplay(!isShowingRealtimeDisplay)
								}}
								data-testid={`toggleRealtimeDisplay`}
							>
								Toggle Realtime Display
							</button>
							{isShowingRealtimeDisplay ? (
								<RealtimeDisplay />
							) : (
								<span data-testid={`noRealtimeDisplay`} />
							)}
						</>
					)
				},
			},
		})

	test(`pull available family member`, async () => {
		const { server, clients, teardown } = scenario()

		const jane = clients.jane.init()

		if (LOGGING) {
			jane.enableLogging()
		}

		act(() => {
			jane.renderResult.getByTestId(`toggleRealtimeDisplay`).click()
		})

		await new Promise<void>((resolve) => {
			jane.socket.once(`serve:numberCollection("foo")`, () => {
				resolve()
			})
		})

		jane.renderResult.getByTestId(`foo`)
		jane.renderResult.getByTestId(`0`)

		server.silo.setState(numberCollectionAtoms, `foo`, (prev) => [...prev, 1])

		await waitFor(() => jane.renderResult.getByTestId(`1`))
		act(() => {
			jane.renderResult.getByTestId(`toggleRealtimeDisplay`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`noRealtimeDisplay`))
		await teardown()
	})
	test(`pull unavailable family member that becomes available`, async () => {
		const { server, clients, teardown } = scenario()

		const jane = clients.jane.init()

		if (LOGGING) {
			jane.enableLogging()
		}

		act(() => {
			jane.renderResult.getByTestId(`toggleRealtimeDisplay`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`foo`))

		act(() => {
			jane.silo.setState(focusedCollectionNameAtom, `bar`)
		})
		await waitFor(() => jane.renderResult.getByTestId(`bar`))

		await new Promise<void>((resolve) => {
			jane.socket.once(`unavailable:numberCollection`, () => {
				resolve()
			})
		})

		server.silo.setState(exposedCollectionAtom, (prev) => prev.add(`bar`))
		server.silo.setState(numberCollectionAtoms, `bar`, (prev) => [...prev, 1])

		await waitFor(() => jane.renderResult.getByTestId(`1`))
		await teardown()
	})
})
