import { act, waitFor } from "@testing-library/react"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

import * as RTTest from "../__util__/realtime"

describe(`multi-client scenario`, () => {
  const scenario = () =>
    RTTest.multiClient({
      store: (silo) => {
        const count = silo.atom({ key: `count`, default: 0 })
        return { count }
      },
      server: ({ socket, tokens, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(tokens.count)
      },
      clients: {
        jim: ({ tokens }) => {
          RTR.usePull(tokens.count)
          const count = AR.useO(tokens.count)
          return <i data-testid={count} />
        },
        lee: ({ tokens }) => {
          RTR.usePull(tokens.count)
          const count = AR.useO(tokens.count)
          return <i data-testid={count} />
        },
      },
    })

  test(`both clients respond to changes on the server`, async () => {
    const {
      clients: { jim, lee },
      server,
      teardown,
    } = scenario()
    jim.renderResult.getByTestId(`0`)
    lee.renderResult.getByTestId(`0`)
    act(() => server.silo.setState(server.tokens.count, 1))
    await waitFor(() => jim.renderResult.getByTestId(`1`))
    await waitFor(() => lee.renderResult.getByTestId(`1`))
    teardown()
  })
})
