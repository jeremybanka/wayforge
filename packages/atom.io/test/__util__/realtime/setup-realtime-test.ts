import * as AtomIO from "atom.io"
import * as ReactAtomIO from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

import { recordToEntries } from "~/packages/anvl/src/object"

export type StoreData = Record<
  string,
  | AtomIO.AtomToken<any>
  | AtomIO.ReadonlySelectorToken<any>
  | AtomIO.SelectorToken<any>
>

export type TestSetupOptions<AppData extends StoreData> = {
  port?: number
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
>

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
): Omit<RealtimeTestingClient<AppData>, `hooks`> => {
  const port = options.port ?? 4554
  const server = new SocketIO.Server(port)
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
  }
}
export const setupRealtimeTestClient = <AppData extends StoreData>(
  options: TestSetupOptions<AppData>,
  name: string
): RealtimeTestingClient<AppData> => {
  const port = options.port ?? 4554
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
  const client = setupRealtimeTestClient(options, `CLIENT`)
  const server = setupRealtimeTestServer(options)

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
      [name]: setupRealtimeTestClient(options, name),
    }),
    {} as Record<ClientNames, RealtimeTestingClient<AppData>>
  )

  return {
    clients,
    server,
    teardown: () => {
      recordToEntries(clients).forEach(([, client]) => client.dispose())
      server.dispose()
    },
  }
}
