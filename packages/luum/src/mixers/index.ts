import type { Applicator } from "~/packages/anvl/src/function"

import type { LuumSpec } from ".."

export type LuumApplicator<X> = Applicator<X, LuumSpec>

export * from "./hue"
export * from "./sat"
export * from "./lum"
export * from "./contrast"
