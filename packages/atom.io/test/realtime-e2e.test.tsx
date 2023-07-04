import * as React from "react"

import { render, prettyDOM, act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"

import * as U from "./__util__"

const summarize = (store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE) => {
  console.log(prettyDOM(document), {
    atoms: [store.atoms.count()],
  })
}

describe(`realtime client`, () => {
  const scenario = () => {
    const { hooks, silos, tokens, teardown } = U.setupRealtimeTest({
      store: (silo) => {
        const count = silo.atom({ key: `count`, default: 0 })
        return { count }
      },
      server: ({ socket, tokens, silo: { store } }) => {
        const exposeSingle = RT.useExposeSingle({ socket, store })
        exposeSingle(tokens.server.count)
      },
    })

    const Letter: React.FC = () => {
      hooks.useRemoteState(tokens.client.count)
      const count = hooks.useO(tokens.client.count)
      return <div data-testid={count}>{count}</div>
    }
    const utils = render(<Letter />)

    return { ...utils, silos, tokens, teardown }
  }

  it(`can get state from the server`, async () => {
    const { getByTestId, silos, tokens, teardown } = scenario()
    getByTestId(`0`)
    summarize()
    act(() => silos.server.setState(tokens.server.count, 1))
    await waitFor(() => getByTestId(`1`))
    teardown()
    summarize()
  })
})
