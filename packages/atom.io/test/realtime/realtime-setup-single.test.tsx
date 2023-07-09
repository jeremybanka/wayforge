import * as React from "react"

import { render, act, waitFor } from "@testing-library/react"
import * as RT from "atom.io/realtime"

import * as RTTest from "../__util__/realtime"

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
