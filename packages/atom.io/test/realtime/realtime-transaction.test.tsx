import * as React from "react"

import { render, act, waitFor } from "@testing-library/react"
import * as RT from "atom.io/realtime"

import * as RTTest from "../__util__/realtime"

describe(`running transactions`, () => {
  const scenario = () => {
    const { server, clients, teardown } = RTTest.multiClient({
      clientNames: [`dave`, `jane`],
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
    })

    const Dave: React.FC = () => {
      clients.dave.hooks.useRemoteState(clients.dave.tokens.count)
      const count = clients.dave.hooks.useO(clients.dave.tokens.count)
      const increment = clients.dave.hooks.useRemoteTransaction(
        clients.dave.tokens.incrementTX
      )
      return (
        <>
          <i data-testid={count + `-dave`} />
          <button onClick={() => increment()} data-testid={`increment-dave`} />
        </>
      )
    }
    const dave = render(<Dave />)

    const Jane: React.FC = () => {
      clients.jane.hooks.useRemoteState(clients.jane.tokens.count)
      const count = clients.jane.hooks.useO(clients.jane.tokens.count)
      return <i data-testid={count + `-jane`} />
    }
    const jane = render(<Jane />)

    return { dave, jane, server, teardown }
  }

  test(`client 1 runs; server runs; client 2 gets updates`, async () => {
    const { dave, jane, teardown } = scenario()
    dave.getByTestId(`0-dave`)
    jane.getByTestId(`0-jane`)
    act(() => dave.getByTestId(`increment-dave`).click())
    await waitFor(() => dave.getByTestId(`1-dave`))
    await waitFor(() => jane.getByTestId(`1-jane`))
    teardown()
  })
})
