import type { Refinement } from "fp-ts/Refinement"

export type Identified = { id: string }
export type TypeBranded = { type: string }

export const hasId: Refinement<unknown, Identified> = (
  input
): input is Identified =>
  typeof input === `object` &&
  input !== null &&
  typeof (input as Identified)[`id`] === `string`

export const identify = (input: unknown): { id: string } => {
  if (hasId(input)) return input
  throw new Error(`${input} could not be identified`)
}
