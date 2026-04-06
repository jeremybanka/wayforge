import { storageSync } from "atom.io/web"

effects: [storageSync(sessionStorage, JSON, `sidebarOpen`)]
