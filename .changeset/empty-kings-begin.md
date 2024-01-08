---
"atom.io": minor
---

✨ `atom.io/realtime` backfills a client-side "fire-and-forget" API for sending transactions to the server. This incurs lower overhead than using the synchronization API.

### Fire-and-forget
- `/realtime-client`: `serverAction` (and `pullState`)
- `/realtime-react`: `useServerAction` (and `usePull`)
- `/realtime-server`: `receiveTransaction` (and `useExposeSingle`)

### Synchronization
- `/realtime-client`: `syncServerAction` (and upcoming initializers)
- `/realtime-react`: `useSyncServerAction` (and upcoming initializers)
- `/realtime-server`: `syncTransaction` (and upcoming initializers)

When using the synchronization API, the server will send back a response to the client. This response is not sent when using the fire-and-forget API. Instead, the client is responsible for maintaining streams to all relevant data via `usePull`.