export type RadialMode = `held` | `idle` | `open`

export type RadialAction = {
	label: string
	do: () => void
}

export * from "./Radial"
export * from "./composeUseRadial"
