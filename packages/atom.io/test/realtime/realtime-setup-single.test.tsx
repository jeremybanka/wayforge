import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

import * as RTTest from "../__util__/realtime"

const countState = AtomIO.atom({ key: `count`, default: 0 })

describe(`single-client scenario`, () => {
  const scenario = () => {
    const { server, client, teardown } = RTTest.singleClient({
      store: () => ({}),
      server: ({ socket, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(countState)
      },
      client: () => {
        RTR.usePull(countState)
        const count = AR.useO(countState)
        return <i data-testid={count} />
      },
    })

    return { client, server, teardown }
  }

  it(`responds to changes on the server`, async () => {
    const { client, server, teardown } = scenario()
    client.renderResult.getByTestId(`0`)
    act(() => server.silo.setState(countState, 1))
    await waitFor(() => client.renderResult.getByTestId(`1`))
    teardown()
  })
})
