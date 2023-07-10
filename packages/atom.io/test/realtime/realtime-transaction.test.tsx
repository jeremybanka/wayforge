import { act, waitFor } from "@testing-library/react"
import * as RT from "atom.io/realtime"

import * as RTTest from "../__util__/realtime"

describe(`running transactions`, () => {
  const scenario = () =>
    RTTest.multiClient({
      store: (silo) => {
        const count = silo.atom({ key: `count`, default: 0 })
        const incrementTX = silo.transaction({
          key: `increment`,
          do: ({ set }) => set(count, (c) => c + 1),
        })
        return { count, incrementTX }
      },
      server: ({ socket, tokens, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        const receiveTransaction = RT.useReceiveTransaction({ socket, store })
        exposeSingle(tokens.count)
        receiveTransaction(tokens.incrementTX)
      },
      clients: {
        dave: ({ hooks, tokens }) => {
          const increment = hooks.useRemoteTransaction(tokens.incrementTX)
          return <button onClick={() => increment()} data-testid={`increment`} />
        },
        jane: ({ hooks, tokens }) => {
          hooks.useRemoteState(tokens.count)
          const count = hooks.useO(tokens.count)
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

  test(`client 2 disconnects/reconnects, gets update`, async () => {
    const {
      clients: { dave, jane },
      teardown,
    } = scenario()
    jane.renderResult.getByTestId(`0`)

    jane.disconnect()

    act(() => dave.renderResult.getByTestId(`increment`).click())

    jane.renderResult.getByTestId(`0`)
    jane.reconnect()
    await waitFor(() => jane.renderResult.getByTestId(`1`))

    teardown()
  })

  test(`client 1 disconnects, makes update, reconnects`, async () => {
    const {
      clients: { dave, jane },
      teardown,
    } = scenario()
    jane.renderResult.getByTestId(`0`)

    dave.disconnect()
    act(() => dave.renderResult.getByTestId(`increment`).click())

    jane.renderResult.getByTestId(`0`)
    dave.reconnect()
    await waitFor(() => jane.renderResult.getByTestId(`1`))

    teardown()
  })
})
