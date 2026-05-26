import type { LuumSpec } from ".."
import type { Applicator } from "../utils/internal"

export type LuumApplicator<X> = Applicator<X, LuumSpec>

export * from "./contrast"
export * from "./hue"
export * from "./lum"
export * from "./sat"
