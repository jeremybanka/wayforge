import * as React from "react"

import { render, act, waitFor } from "@testing-library/react"
import * as RT from "atom.io/realtime"

import * as RTTest from "./__util__/realtime"

describe(`single-client scenario`, () => {
  const scenario = () => {
    const { server, client, teardown } = RTTest.singleClient({
      store: (silo) => {
        const count = silo.atom({ key: `count`, default: 0 })
        return { count }
      },
      server: ({ socket, tokens, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(tokens.count)
      },
    })

    const App: React.FC = () => {
      client.hooks.useRemoteState(client.tokens.count)
      const count = client.hooks.useO(client.tokens.count)
      return <i data-testid={count} />
    }
    const utils = render(<App />)

    return { ...utils, client, server, teardown }
  }

  it(`responds to changes on the server`, async () => {
    const { getByTestId, server, teardown } = scenario()
    getByTestId(`0`)
    act(() => server.silo.setState(server.tokens.count, 1))
    await waitFor(() => getByTestId(`1`))
    teardown()
  })
})

describe(`multi-client scenario`, () => {
  const scenario = () => {
    const { server, clients, teardown } = RTTest.multiClient({
      clientNames: [`jim`, `lee`],
      store: (silo) => {
        const count = silo.atom({ key: `count`, default: 0 })
        return { count }
      },
      server: ({ socket, tokens, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(tokens.count)
      },
    })

    const Jim: React.FC = () => {
      clients.jim.hooks.useRemoteState(clients.jim.tokens.count)
      const count = clients.jim.hooks.useO(clients.jim.tokens.count)
      return <i data-testid={count + `-jim`} />
    }
    const jim = render(<Jim />)

    const Lee: React.FC = () => {
      clients.lee.hooks.useRemoteState(clients.lee.tokens.count)
      const count = clients.lee.hooks.useO(clients.lee.tokens.count)
      return <i data-testid={count + `-lee`} />
    }
    const lee = render(<Lee />)

    return { jim, lee, server, teardown }
  }

  test(`both clients respond to changes on the server`, async () => {
    const { jim, lee, server, teardown } = scenario()
    jim.getByTestId(`0-jim`)
    lee.getByTestId(`0-lee`)
    act(() => server.silo.setState(server.tokens.count, 1))
    await waitFor(() => jim.getByTestId(`1-jim`))
    await waitFor(() => lee.getByTestId(`1-lee`))
    teardown()
  })
})

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
