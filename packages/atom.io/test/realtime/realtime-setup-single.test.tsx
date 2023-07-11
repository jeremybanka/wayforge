import { act, waitFor } from "@testing-library/react"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

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
      client: ({ tokens }) => {
        RTR.usePull(tokens.count)
        const count = AR.useO(tokens.count)
        return <i data-testid={count} />
      },
    })

    return { client, server, teardown }
  }

  it(`responds to changes on the server`, async () => {
    const { client, server, teardown } = scenario()
    client.renderResult.getByTestId(`0`)
    act(() => server.silo.setState(server.tokens.count, 1))
    await waitFor(() => client.renderResult.getByTestId(`1`))
    teardown()
  })
})
