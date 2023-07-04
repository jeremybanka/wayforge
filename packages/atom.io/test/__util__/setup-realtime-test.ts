import * as AtomIO from "atom.io"
import * as ReactAtomIO from "atom.io/react"
import * as RTC from "atom.io/realtime-client"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

export type RealtimeTestSetupOptions<
  Store extends Record<
    string,
    | AtomIO.AtomToken<any>
    | AtomIO.ReadonlySelectorToken<any>
    | AtomIO.SelectorToken<any>
  >
> = {
  port?: number
  store: (silo: ReturnType<typeof AtomIO.silo>) => Store
  server: (tools: {
    socket: SocketIO.Socket
    silo: ReturnType<typeof AtomIO.silo>
    hooks: ReturnType<typeof ReactAtomIO.composeStoreHooks> &
      ReturnType<typeof RTC.composeRealtimeHooks>
    tokens: {
      client: Store
      server: Store
    }
  }) => void
}

export type RealtimeTestUtilities<
  Store extends Record<
    string,
    | AtomIO.AtomToken<any>
    | AtomIO.ReadonlySelectorToken<any>
    | AtomIO.SelectorToken<any>
  >
> = {
  hooks: ReturnType<typeof ReactAtomIO.composeStoreHooks> &
    ReturnType<typeof RTC.composeRealtimeHooks>
  silos: {
    client: ReturnType<typeof AtomIO.silo>
    server: ReturnType<typeof AtomIO.silo>
  }
  tokens: {
    client: Store
    server: Store
  }
  teardown: () => void
}

export const setupRealtimeTest = <
  Store extends Record<
    string,
    | AtomIO.AtomToken<any>
    | AtomIO.ReadonlySelectorToken<any>
    | AtomIO.SelectorToken<any>
  >
>(
  options: RealtimeTestSetupOptions<Store>
): RealtimeTestUtilities<Store> => {
  const port = options.port ?? 4554

  const server = new SocketIO.Server(port)
  const client: ClientSocket = io(`http://localhost:${port}/`)

  const silos = {
    client: AtomIO.silo(`CLIENT`),
    server: AtomIO.silo(`SERVER`),
  }

  const storeHooks = ReactAtomIO.composeStoreHooks(silos.client.store)
  const realtimeHooks = RTC.composeRealtimeHooks(client, silos.client.store)

  const hooks = {
    ...storeHooks,
    ...realtimeHooks,
  }

  const tokens = {
    client: options.store(silos.client),
    server: options.store(silos.server),
  }

  server.on(`connection`, (socket: SocketIO.Socket) => {
    const silo = silos.server
    options.server({ socket, hooks, silo, tokens })
  })

  const teardown = () => {
    server.close()
    AtomIO.__INTERNAL__.clearStore(silos.client.store)
    AtomIO.__INTERNAL__.clearStore(silos.server.store)
  }

  return { hooks, silos, tokens, teardown }
}
