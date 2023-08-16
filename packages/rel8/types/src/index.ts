export * from "./json"

export type Refinement<Unrefined, Refined extends Unrefined> = (
	value: Unrefined,
) => value is Refined

export type Cardinality = `1:1` | `1:n` | `n:n`
