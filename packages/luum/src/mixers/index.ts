import type { Applicator } from "anvl/function"

import type { LuumSpec } from ".."

export type LuumApplicator<X> = Applicator<X, LuumSpec>

export * from "./contrast"
export * from "./hue"
export * from "./lum"
export * from "./sat"
