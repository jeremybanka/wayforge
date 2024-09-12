import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"

const numberCollectionAtoms = AtomIO.atomFamily<number[], string>({
	key: `numbersCollection`,
	default: [0],
})
const findCollectionSumState = AtomIO.selectorFamily<number, string>({
	key: `collectionSum`,
	get:
		(id) =>
		({ find, get }) => {
			const numbers = get(find(numberCollectionAtoms, id))
			return numbers.reduce((a, b) => a + b, 0)
		},
})
const numbersCollectionIndex = AtomIO.atom<Set<string>>({
	key: `numbersCollectionIndex`,
	default: new Set([`foo`]),
})
const addToNumbersCollectionTX = AtomIO.transaction<
	(collectionKey: string) => void
>({
	key: `addToNumbersCollection`,
	do: ({ set }, collectionKey) => {
		set(numberCollectionAtoms, collectionKey, (ns) => {
			return [...ns, ns.length]
		})
	},
})

function RealtimeDisplay(): JSX.Element {
	RTR.usePullAtomFamilyMember(numberCollectionAtoms, `foo`)
	RTR.usePullSelectorFamilyMember(findCollectionSumState, `foo`)
	const numbers = AR.useO(numberCollectionAtoms, `foo`)
	const sum = AR.useO(findCollectionSumState, `foo`)
	console.log({ numbers, sum })
	return (
		<>
			{numbers.map((n) => (
				<i data-testid={n} key={n} />
			))}
		</>
	)
}

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			port: 4915,
			server: ({ socket, silo: { store } }) => {
				const exposeFamily = RTS.realtimeAtomFamilyProvider({
					socket,
					store,
				})
				const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
				exposeFamily(numberCollectionAtoms, numbersCollectionIndex)
				receiveTransaction(addToNumbersCollectionTX)
			},
			clients: {
				dave: () => {
					const addToNumbersCollection = RTR.useServerAction(
						addToNumbersCollectionTX,
					)
					const store = React.useContext(AR.StoreContext)

					return (
						<button
							type="button"
							onClick={() => {
								addToNumbersCollection(`foo`)
							}}
							data-testid={`addNumber`}
						/>
					)
				},
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

	test(`client 1 -> server -> client 2`, async () => {
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		act(() => {
			jane.renderResult.getByTestId(`toggleRealtimeDisplay`).click()
		})
		jane.renderResult.getByTestId(`0`)
		act(() => {
			dave.renderResult.getByTestId(`addNumber`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		act(() => {
			jane.renderResult.getByTestId(`toggleRealtimeDisplay`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`noRealtimeDisplay`))
		teardown()
	})
})
