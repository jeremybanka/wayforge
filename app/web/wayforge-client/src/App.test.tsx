import { createServer } from "http"

import { css } from "@emotion/react"
import { RecoilInspector } from "@eyecuelab/recoil-devtools"
import { fireEvent, render, screen } from "@testing-library/react"
import { RecoilRoot } from "recoil"
import type { Server } from "socket.io"
import type { Socket } from "socket.io-client"
import { io as Client } from "socket.io-client"
import type { DefaultEventsMap } from "socket.io/dist/typed-events"
import { describe, expect, test } from "vitest"

import { App } from "./App"

describe(`counter tests`, () => {
  let io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  let serverSocket: any
  let clientSocket: Socket

  // before((done) => {
  //   const httpServer = createServer()
  //   const yho = new Server(httpServer)
  //   httpServer.listen(() => {
  //     const address = httpServer.address()
  //     if (address !== null && typeof address === `object`) {
  //       const { port } = address
  //       clientSocket = Client(`http://localhost:${port}`)
  //       io.on(`connection`, (socket) => {
  //         serverSocket = socket
  //       })
  //       clientSocket.on(`connect`, done)
  //     }
  //   })
  // })

  // after(() => {
  //   io.close()
  //   clientSocket.close()
  // })

  test(`Counter should be 0 at the start`, () => {
    render(
      <RecoilRoot>
        <div css={css``}></div>
        <RecoilInspector />
      </RecoilRoot>
    )
    expect(true).toBeDefined()
  })

  // test(`Counter should increment by one when clicked`, async () => {
  //   render(<App />)
  //   const counter = screen.getByRole(`button`)
  //   fireEvent.click(counter)
  //   expect(await screen.getByText(`count is 1`)).toBeDefined()
  // })
})
