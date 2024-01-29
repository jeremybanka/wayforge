---
"atom.io": minor
---

🎁 New Subpackage! `atom.io/realtime` introduces the new end-to-end `continuity` API.

`continuity` Is an out-of-the-box solution for efficient rollback netcode with adversarial perspectives. It tracks a group of global states, actions, and "perspectives". Assuming the global and perspective-bound states are only updated via the listed actions, `continuity` allows clients to optimistically predict the global state from their perspective, and roll back to the correct state when the server disagrees.

- ✨ `realtime-server` `continuitySynchronizer`
- ✨ `realtime-client` `syncContinuity`
- ✨ `realtime-react` `useSyncContinuity`