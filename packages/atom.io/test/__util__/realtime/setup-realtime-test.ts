import * as http from "http"

import * as AtomIO from "atom.io"
import * as ReactAtomIO from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as RR from "fp-ts/ReadonlyRecord"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

export type StoreData = Record<
  string,
  | AtomIO.AtomToken<any>
  | AtomIO.ReadonlySelectorToken<any>
  | AtomIO.SelectorToken<any>
  | AtomIO.TransactionToken<any>
>

export type TestSetupOptions<AppData extends StoreData> = {
  store: (silo: AtomIO.Silo) => AppData
  server: (tools: {
    socket: SocketIO.Socket
    silo: AtomIO.Silo
    tokens: AppData
  }) => void
}
export type TestSetupOptions__MultiClient<
  AppData extends StoreData,
  ClientNames extends string,
> = TestSetupOptions<AppData> & {
  clientNames: ClientNames[]
}

export type RealtimeTestingClient<AppData extends StoreData> = {
  name: string
  silo: AtomIO.Silo
  hooks: ReactAtomIO.StoreHooks & RTC.RealtimeClientHooks
  tokens: AppData
  dispose: () => void
}
export type RealtimeTestingServer<AppData extends StoreData> = Omit<
  RealtimeTestingClient<AppData>,
  `hooks`
> & {
  port: number
}

export type RealtimeTestUtilities<AppData extends StoreData> = {
  server: RealtimeTestingServer<AppData>
  teardown: () => void
}
export type RealtimeTestUtilities__SingleClient<AppData extends StoreData> =
  RealtimeTestUtilities<AppData> & {
    client: RealtimeTestingClient<AppData>
  }
export type RealtimeTestUtilities__MultiClient<
  AppData extends StoreData,
  ClientNames extends string,
> = RealtimeTestUtilities<AppData> & {
  clients: Record<ClientNames, RealtimeTestingClient<AppData>>
}

export const setupRealtimeTestServer = <AppData extends StoreData>(
  options: TestSetupOptions<AppData>
): RealtimeTestingServer<AppData> => {
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
  options: TestSetupOptions<AppData>,
  name: string,
  port: number
): RealtimeTestingClient<AppData> => {
  const socket: ClientSocket = io(`http://localhost:${port}/`)
  const silo = AtomIO.silo(name)

  const storeHooks = ReactAtomIO.composeStoreHooks(silo.store)
  const realtimeHooks = RTC.composeRealtimeHooks(socket, silo.store)

  const hooks = {
    ...storeHooks,
    ...realtimeHooks,
  }

  const tokens = options.store(silo)

  const dispose = () => {
    socket.disconnect()
    AtomIO.__INTERNAL__.clearStore(silo.store)
  }

  return {
    name,
    silo,
    hooks,
    tokens,
    dispose,
  }
}

export const singleClient = <AppData extends StoreData>(
  options: TestSetupOptions<AppData>
): RealtimeTestUtilities__SingleClient<AppData> => {
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
): RealtimeTestUtilities__MultiClient<AppData, ClientNames> => {
  const server = setupRealtimeTestServer(options)
  const clients = options.clientNames.reduce(
    (clients, name) => ({
      ...clients,
      [name]: setupRealtimeTestClient(options, name, server.port),
    }),
    {} as Record<ClientNames, RealtimeTestingClient<AppData>>
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
