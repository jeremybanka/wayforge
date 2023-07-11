import * as http from "http"

import { prettyDOM, render, type RenderResult } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as ReactAtomIO from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as RR from "fp-ts/ReadonlyRecord"
import * as Happy from "happy-dom"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

export type StoreData = Record<
  string,
  | AtomIO.AtomToken<any>
  | AtomIO.ReadonlySelectorToken<any>
  | AtomIO.SelectorToken<any>
  | AtomIO.TimelineToken
  | AtomIO.TransactionToken<any>
>

export type RealtimeTestFC<AppData extends StoreData> = React.FC<{
  name: string
  hooks: ReactAtomIO.StoreHooks & RTC.RealtimeClientHooks
  tokens: AppData
  silo: AtomIO.Silo
}>

export type TestSetupOptions<AppData extends StoreData> = {
  store: (silo: AtomIO.Silo) => AppData
  server: (tools: {
    socket: SocketIO.Socket
    silo: AtomIO.Silo
    tokens: AppData
  }) => void
}
export type TestSetupOptions__SingleClient<AppData extends StoreData> =
  TestSetupOptions<AppData> & {
    client: RealtimeTestFC<AppData>
  }
export type TestSetupOptions__MultiClient<
  AppData extends StoreData,
  ClientNames extends string,
> = TestSetupOptions<AppData> & {
  clients: {
    [K in ClientNames]: RealtimeTestFC<AppData>
  }
}

export type RealtimeTestTools<AppData extends StoreData> = {
  name: string
  silo: AtomIO.Silo
  tokens: AppData
  dispose: () => void
}
export type RealtimeTestClient<AppData extends StoreData> =
  RealtimeTestTools<AppData> & {
    hooks: ReactAtomIO.StoreHooks & RTC.RealtimeClientHooks
    renderResult: RenderResult
    prettyPrint: () => void
    reconnect: () => void
    disconnect: () => void
  }
export type RealtimeTestServer<AppData extends StoreData> =
  RealtimeTestTools<AppData> & {
    port: number
  }

export type RealtimeTestAPI<AppData extends StoreData> = {
  server: RealtimeTestServer<AppData>
  teardown: () => void
}
export type RealtimeTestAPI__SingleClient<AppData extends StoreData> =
  RealtimeTestAPI<AppData> & {
    client: RealtimeTestClient<AppData>
  }
export type RealtimeTestAPI__MultiClient<
  AppData extends StoreData,
  ClientNames extends string,
> = RealtimeTestAPI<AppData> & {
  clients: Record<ClientNames, RealtimeTestClient<AppData>>
}

export const setupRealtimeTestServer = <AppData extends StoreData>(
  options: TestSetupOptions<AppData>
): RealtimeTestServer<AppData> => {
  const httpServer = http.createServer((_, res) => res.end(`Hello World!`))
  const address = httpServer.listen().address()
  const port =
    typeof address === `string` ? 80 : address === null ? null : address.port
  if (port === null) throw new Error(`Could not determine port for test server`)
  const server = new SocketIO.Server(httpServer)
  const silo = AtomIO.silo(`SERVER`)
  const tokens = options.store(silo)

  server.on(`connection`, (socket: SocketIO.Socket) => {
    options.server({ socket, silo, tokens })
  })

  const dispose = () => {
    server.close()
    AtomIO.__INTERNAL__.clearStore(silo.store)
  }

  return {
    name: `SERVER`,
    silo,
    tokens,
    dispose,
    port,
  }
}
export const setupRealtimeTestClient = <AppData extends StoreData>(
  options: TestSetupOptions__SingleClient<AppData>,
  name: string,
  port: number
): RealtimeTestClient<AppData> => {
  const socket: ClientSocket = io(`http://localhost:${port}/`)
  const silo = AtomIO.silo(name)

  const realtimeHooks = RTC.composeRealtimeHooks(socket, silo.store)

  const hooks = {
    ...ReactAtomIO.storeHooks,
    ...realtimeHooks,
  }

  const tokens = options.store(silo)

  const { document } = new Happy.Window()
  document.body.innerHTML = `<div id="app"></div>`
  const renderResult = render(
    <ReactAtomIO.StoreProvider store={silo.store}>
      <options.client name={name} hooks={hooks} tokens={tokens} silo={silo} />
    </ReactAtomIO.StoreProvider>,
    {
      container: document.querySelector(`#app`) as unknown as HTMLElement,
    }
  )

  const prettyPrint = () => console.log(prettyDOM(renderResult.container))

  const disconnect = () => socket.disconnect()
  const reconnect = () => socket.connect()

  const dispose = () => {
    socket.disconnect()
    AtomIO.__INTERNAL__.clearStore(silo.store)
  }

  return {
    name,
    silo,
    hooks,
    tokens,
    renderResult,
    prettyPrint,
    disconnect,
    reconnect,
    dispose,
  }
}

export const singleClient = <AppData extends StoreData>(
  options: TestSetupOptions__SingleClient<AppData>
): RealtimeTestAPI__SingleClient<AppData> => {
  const server = setupRealtimeTestServer(options)
  const client = setupRealtimeTestClient(options, `CLIENT`, server.port)

  return {
    client,
    server,
    teardown: () => {
      client.dispose()
      server.dispose()
    },
  }
}

export const multiClient = <
  AppData extends StoreData,
  ClientNames extends string,
>(
  options: TestSetupOptions__MultiClient<AppData, ClientNames>
): RealtimeTestAPI__MultiClient<AppData, ClientNames> => {
  const server = setupRealtimeTestServer(options)
  const clients = RR.toEntries(options.clients).reduce(
    (clients, [name, client]) => ({
      ...clients,
      [name]: setupRealtimeTestClient({ ...options, client }, name, server.port),
    }),
    {} as Record<ClientNames, RealtimeTestClient<AppData>>
  )

  return {
    clients,
    server,
    teardown: () => {
      RR.toEntries(clients).forEach(([, client]) => client.dispose())
      server.dispose()
    },
  }
}
