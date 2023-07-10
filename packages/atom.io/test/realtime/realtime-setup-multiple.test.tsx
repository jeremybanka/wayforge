import * as React from "react"

import { render, act, waitFor } from "@testing-library/react"
import * as RT from "atom.io/realtime"

import * as RTTest from "../__util__/realtime"

describe(`multi-client scenario`, () => {
  const scenario = () => {
    const { server, clients, teardown } = RTTest.multiClient({
      store: (silo) => {
        const count = silo.atom({ key: `count`, default: 0 })
        return { count }
      },
      server: ({ socket, tokens, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(tokens.count)
      },
      clients: {
        jim: ({ hooks, tokens }) => {
          hooks.useRemoteState(tokens.count)
          const count = hooks.useO(tokens.count)
          return <i data-testid={count} />
        },
        lee: ({ hooks, tokens }) => {
          hooks.useRemoteState(tokens.count)
          const count = hooks.useO(tokens.count)
          return <i data-testid={count} />
        },
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
