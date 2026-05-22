# sync with session storage

Source: src/exhibits/web/sync-with-session-storage.ts

```ts
import { storageSync } from "atom.io/web"

effects: [storageSync(sessionStorage, JSON, `sidebarOpen`)]
```
