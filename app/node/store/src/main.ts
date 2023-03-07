import dotenv from "dotenv"
import { pipe } from "fp-ts/function"
import git from "simple-git"
import { Server as WebSocketServer } from "socket.io"

import { serveFilestore } from "~/packages/socket-io.filestore/src/node/socket-filestore-node"
import { serveSimpleGit } from "~/packages/socket-io.git/src/socket-io-git.node"

import { logger } from "./logger"
import { formatJson } from "./services/formatJson"

dotenv.config()
pipe(
  new WebSocketServer(3333, {
    cors: {
      origin: `http://localhost:5173`,
      methods: [`GET`, `POST`],
    },
  }),
  serveFilestore({
    logger,
    formatResource: formatJson,
    baseDir: process.env.BASE_DIR || `json`,
  }),
  serveSimpleGit({
    logger,
    git: git({ baseDir: process.env.BASE_DIR }),
  })
)
logger.info(
  `   `,
  `|¯\\_________________________________|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\\_|`
)
logger.info(``, ``)

logger.info(
  `[/]`,
  `|__________________________/ `,
  `🟨   🟨   🟨`,
  ` \\___________________________|`
)
logger.info(`[/]`, `                             `, `🟨   🟨   🟨`)
logger.info(
  `[/]`,
  `  00                         `,
  `🟨   🟨   🟨`,
  `                    WAYFORGE`
)
logger.info(`[/]`, `                             `, `🟨        🟨`)
logger.info(
  `[/]`,
  `|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\\ `,
  `🟨🟨🟨🟨🟨🟨`,
  ` /¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|`
)
logger.info(``, ``)
logger.info(
  `   `,
  `|_/¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|_________________________________/¯|`
)

// \_|_/ /-\ `-/ |-¯ |¯_| |¯/, |¯_, |-¯_
