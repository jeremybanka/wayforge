import log from "npmlog"
import { setLogLevel } from "~/packages/atom.io/src"

export const logger = log
setLogLevel(`info`)
