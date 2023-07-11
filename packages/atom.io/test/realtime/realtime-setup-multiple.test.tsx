import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

import * as RTTest from "../__util__/realtime"

const countState = AtomIO.atom({ key: `count`, default: 0 })

describe(`multi-client scenario`, () => {
  const scenario = () =>
    RTTest.multiClient({
      store: () => {
        return { countState }
      },
      server: ({ socket, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(countState)
      },
      clients: {
        jim: () => {
          RTR.usePull(countState)
          const count = AR.useO(countState)
          return <i data-testid={count} />
        },
        lee: () => {
          RTR.usePull(countState)
          const count = AR.useO(countState)
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
    act(() => server.silo.setState(countState, 1))
    await waitFor(() => jim.renderResult.getByTestId(`1`))
    await waitFor(() => lee.renderResult.getByTestId(`1`))
    teardown()
  })
})
