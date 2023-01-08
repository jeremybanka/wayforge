import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"

import { serveSimpleGit } from "~/packages/Hammer/recoil-tools/effects/git-io"
import { serveJsonStore } from "~/packages/Hammer/recoil-tools/effects/json-store-io.node"

import { logger } from "./logger"
import { formatJson } from "./services/formatJson"

pipe(
  new WebSocketServer(3333, {
    cors: {
      origin: `http://localhost:5173`,
      methods: [`GET`, `POST`],
    },
  }),
  serveJsonStore({
    logger,
    formatResource: formatJson,
    baseDir: `./projects/wayfarer`,
  }),
  serveSimpleGit({
    logger,
    baseDir: `./projects/`,
  })
)

// const app = express()
// const server = new HttpServer(app)
// server.on(`error`, logger.error)

// logger.info(`Listening on port 3333`)
// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
// app.disable(`x-powered-by`)

// const port = process.env.port || 3333
// app.use(cors())
// const server = app.listen(port, () => {
//   console.log(`Listening at http://localhost:${port}/api`)
// })
