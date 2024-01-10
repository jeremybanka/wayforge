---
"atom.io": minor
---

💥 BREAKING CHANGE: `atom.io/realtime` has renamed most core functions to organize the design around three core APIs:
- Isolated
- Shared
- Adversarial

### Isolated 
Used for data that is controlled by a single user. This data can safely be persisted to the server and relayed to other users without any additional synchronization logic.
|            | Get                                                                                                        | Set                              |
| ---------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **React**  | `usePull` `usePullMutable` `usePullFamilyMember` `usePullFamilyMember`                                     | `usePush` (variants coming soon) |
| **Client** | `pullState` `pullMutable` `pullFamilyMember` `pullMutableFamilyMember`                                     | `pushState`                      |
| **Server** | `realtimeStateProvider` `realtimeMutableProvider` `realtimeFamilyProvider` `realtimeMutableFamilyProvider` | `realtimeStateReceiver`          |

### Shared
Used for low-complexity data that is shared between multiple users. Updated on the server via transactions, and updated on the client via state subscriptions.
|            | Get                                                                                                        | Set                      |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
| **React**  | `usePull` `usePullMutable` `usePullFamilyMember` `usePullFamilyMember`                                     | `useServerAction`        |
| **Client** | `pullState` `pullMutable` `pullFamilyMember` `pullMutableFamilyMember`                                     | `serverAction`           |
| **Server** | `realtimeStateProvider` `realtimeMutableProvider` `realtimeFamilyProvider` `realtimeMutableFamilyProvider` | `realtimeActionReceiver` |

### Adversarial
Best for situations where speed and the ability to rollback is necessary. Updated on the server via transactions, reconciled on the client.
|            | Get                                       | Set                          |
| ---------- | ----------------------------------------- | ---------------------------- |
| **React**  | `useSyncState` (coming soon)              | `useSyncAction`              |
| **Client** | `syncState` (coming soon)                 | `syncAction`                 |
| **Server** | `realtimeStateSynchronizer` (coming soon) | `realtimeActionSynchronizer` |